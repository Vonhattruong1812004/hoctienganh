import Foundation
import PDFKit

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let keyRoot = repoRoot.appendingPathComponent("ETS/KEY VÀ GIẢI THÍCH CHI TIẾT")
let outputURL = repoRoot.appendingPathComponent("apps/web/src/lib/ets-answer-keys.ts")

func pdfText(_ url: URL) -> String {
  guard let document = PDFDocument(url: url) else {
    fputs("Cannot open PDF: \(url.path)\n", stderr)
    return ""
  }

  var chunks: [String] = []
  for pageIndex in 0..<document.pageCount {
    if let pageText = document.page(at: pageIndex)?.string, !pageText.isEmpty {
      chunks.append(pageText)
    }
  }
  return chunks.joined(separator: "\n")
}

func regex(_ pattern: String, options: NSRegularExpression.Options = []) -> NSRegularExpression {
  do {
    return try NSRegularExpression(pattern: pattern, options: options)
  } catch {
    fatalError("Invalid regex \(pattern): \(error)")
  }
}

func firstMatch(_ pattern: String, in text: String, options: NSRegularExpression.Options = []) -> String? {
  let nsText = text as NSString
  let expression = regex(pattern, options: options)
  guard let match = expression.firstMatch(in: text, range: NSRange(location: 0, length: nsText.length)), match.numberOfRanges > 1 else {
    return nil
  }
  return nsText.substring(with: match.range(at: 1))
}

func lineStartPositions(for question: Int, in text: String) -> [Int] {
  let escaped = NSRegularExpression.escapedPattern(for: String(question))
  let expression = regex("(?m)^\\s*\(escaped)(?:\\.|\\s|$|-)")
  let nsText = text as NSString
  return expression.matches(in: text, range: NSRange(location: 0, length: nsText.length)).map { $0.range.location }
}

func segment(for question: Int, in text: String) -> String {
  let nsText = text as NSString
  guard let start = lineStartPositions(for: question, in: text).first else { return "" }

  var end = nsText.length
  if question < 200 {
    for nextQuestion in (question + 1)...200 {
      if let nextStart = lineStartPositions(for: nextQuestion, in: text).first(where: { $0 > start }) {
        end = nextStart
        break
      }
    }
  }

  return nsText.substring(with: NSRange(location: start, length: max(0, end - start)))
}

func answerFromSegment(_ segment: String, question: Int) -> String? {
  let patterns = [
    #"(?i)Chọn\s*\(?([A-D])\)?"#,
    #"(?m)^\s*\#(question)\.\s*$\n\s*([A-D])\s*$"#,
    #"(?m)^\s*([A-D])\s*$"#,
    #"(?m)^\s*([A-D])\s+(?:\(|[A-ZÀ-Ỵ])"#,
  ]

  for (index, pattern) in patterns.enumerated() {
    if index == 1 {
      let expression = regex(pattern)
      let nsText = segment as NSString
      if let match = expression.firstMatch(in: segment, range: NSRange(location: 0, length: nsText.length)), match.numberOfRanges > 2 {
        return nsText.substring(with: match.range(at: 2))
      }
      continue
    }

    if let answer = firstMatch(pattern, in: segment) {
      return answer.uppercased()
    }
  }

  return nil
}

func answerMap(from text: String, range: ClosedRange<Int>) -> [Int: String] {
  var result: [Int: String] = [:]

  let nsText = text as NSString
  let answerListExpression = regex("(?m)^\\s*(\\d{1,3})\\.\\s*$\\n\\s*([A-D])\\s*$")
  for match in answerListExpression.matches(in: text, range: NSRange(location: 0, length: nsText.length)) where match.numberOfRanges > 2 {
    let question = Int(nsText.substring(with: match.range(at: 1))) ?? 0
    if range.contains(question) {
      result[question] = nsText.substring(with: match.range(at: 2))
    }
  }

  for question in range {
    if result[question] != nil { continue }
    let questionSegment = segment(for: question, in: text)
    if let answer = answerFromSegment(questionSegment, question: question) {
      result[question] = answer
    }
  }
  return result
}

func sortedObject(_ answers: [Int: String]) -> String {
  answers.keys.sorted().map { question in
    "      \(question): '\(answers[question] ?? "")'"
  }.joined(separator: ",\n")
}

var tests: [Int: [Int: String]] = [:]

for testNumber in 1...10 {
  let listeningURL = keyRoot.appendingPathComponent("ETS 2026 LISTENING TEST \(testNumber) (SCRIPT AND KEY).pdf")
  let readingURL = keyRoot.appendingPathComponent("ETS 2026 READING TEST \(testNumber)- KEY.pdf")
  let answers = answerMap(from: pdfText(listeningURL), range: 1...100)
    .merging(answerMap(from: pdfText(readingURL), range: 101...200)) { current, _ in current }
  tests[testNumber] = answers
  print("Test \(testNumber): \(answers.count)/200 answers")
}

let body = tests.keys.sorted().map { testNumber in
  let answers = tests[testNumber] ?? [:]
  return """
    \(testNumber): {
\(sortedObject(answers))
    }
"""
}.joined(separator: ",\n")

let output = """
export const etsAnswerKeys: Record<number, Record<number, string>> = {
\(body)
};

export function getEtsAnswerKey(testNumber: number, questionNumber: number) {
  return etsAnswerKeys[testNumber]?.[questionNumber] ?? '';
}

export function getEtsAnswerKeysForQuestions(testNumber: number, questions: number[]) {
  return questions.reduce<Record<number, string>>((result, question) => {
    const answer = getEtsAnswerKey(testNumber, question);
    if (answer) result[question] = answer;
    return result;
  }, {});
}
"""

try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
try output.write(to: outputURL, atomically: true, encoding: .utf8)
print("Wrote \(outputURL.path)")
