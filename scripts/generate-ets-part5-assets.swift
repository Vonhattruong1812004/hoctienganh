import AppKit
import PDFKit

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let pdfURL = repoRoot.appendingPathComponent("ETS/ETS 2026- RC.pdf")
let outputRoot = repoRoot.appendingPathComponent("apps/web/public/ets/part5")
let scale: CGFloat = 2.0

struct CropSpec {
  let question: Int
  let pageOffset: Int
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat
}

let specs: [CropSpec] = [
  CropSpec(question: 101, pageOffset: 1, x: 62, y: 265, width: 245, height: 90),
  CropSpec(question: 102, pageOffset: 1, x: 62, y: 355, width: 245, height: 92),
  CropSpec(question: 103, pageOffset: 1, x: 62, y: 450, width: 245, height: 105),
  CropSpec(question: 104, pageOffset: 1, x: 62, y: 565, width: 245, height: 125),
  CropSpec(question: 105, pageOffset: 1, x: 315, y: 265, width: 245, height: 95),
  CropSpec(question: 106, pageOffset: 1, x: 315, y: 365, width: 245, height: 105),
  CropSpec(question: 107, pageOffset: 1, x: 315, y: 475, width: 245, height: 115),
  CropSpec(question: 108, pageOffset: 1, x: 315, y: 590, width: 245, height: 120),

  CropSpec(question: 109, pageOffset: 2, x: 62, y: 45, width: 245, height: 105),
  CropSpec(question: 110, pageOffset: 2, x: 62, y: 152, width: 245, height: 110),
  CropSpec(question: 111, pageOffset: 2, x: 62, y: 265, width: 245, height: 105),
  CropSpec(question: 112, pageOffset: 2, x: 62, y: 375, width: 245, height: 115),
  CropSpec(question: 113, pageOffset: 2, x: 62, y: 495, width: 245, height: 115),
  CropSpec(question: 114, pageOffset: 2, x: 62, y: 620, width: 245, height: 115),
  CropSpec(question: 115, pageOffset: 2, x: 315, y: 45, width: 245, height: 105),
  CropSpec(question: 116, pageOffset: 2, x: 315, y: 152, width: 245, height: 115),
  CropSpec(question: 117, pageOffset: 2, x: 315, y: 275, width: 245, height: 115),
  CropSpec(question: 118, pageOffset: 2, x: 315, y: 398, width: 245, height: 92),
  CropSpec(question: 119, pageOffset: 2, x: 315, y: 498, width: 245, height: 115),
  CropSpec(question: 120, pageOffset: 2, x: 315, y: 620, width: 245, height: 110),

  CropSpec(question: 121, pageOffset: 3, x: 62, y: 45, width: 245, height: 105),
  CropSpec(question: 122, pageOffset: 3, x: 62, y: 152, width: 245, height: 115),
  CropSpec(question: 123, pageOffset: 3, x: 62, y: 275, width: 245, height: 110),
  CropSpec(question: 124, pageOffset: 3, x: 62, y: 390, width: 245, height: 110),
  CropSpec(question: 125, pageOffset: 3, x: 62, y: 512, width: 245, height: 125),
  CropSpec(question: 126, pageOffset: 3, x: 315, y: 45, width: 245, height: 120),
  CropSpec(question: 127, pageOffset: 3, x: 315, y: 168, width: 245, height: 120),
  CropSpec(question: 128, pageOffset: 3, x: 315, y: 292, width: 245, height: 105),
  CropSpec(question: 129, pageOffset: 3, x: 315, y: 405, width: 245, height: 105),
  CropSpec(question: 130, pageOffset: 3, x: 315, y: 520, width: 245, height: 115),
]

guard let document = PDFDocument(url: pdfURL) else {
  fputs("Cannot open PDF: \(pdfURL.path)\n", stderr)
  exit(1)
}

func renderPage(_ page: PDFPage) -> CGImage? {
  let bounds = page.bounds(for: .mediaBox)
  let width = Int(bounds.width * scale)
  let height = Int(bounds.height * scale)
  let image = NSImage(size: NSSize(width: width, height: height))

  image.lockFocus()
  guard let context = NSGraphicsContext.current?.cgContext else {
    image.unlockFocus()
    return nil
  }
  NSColor.white.setFill()
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  context.saveGState()
  context.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: context)
  context.restoreGState()
  image.unlockFocus()

  guard let tiffData = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiffData) else {
    return nil
  }
  return bitmap.cgImage
}

func writePng(_ image: CGImage, to url: URL) throws {
  let bitmap = NSBitmapImageRep(cgImage: image)
  guard let data = bitmap.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "GenerateEtsPart5", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot encode PNG"])
  }
  try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try data.write(to: url)
}

for testNumber in 1...10 {
  let testStartPage = 1 + (testNumber - 1) * 30
  var renderedPages: [Int: CGImage] = [:]

  for spec in specs {
    let pageNumber = testStartPage + spec.pageOffset
    if renderedPages[pageNumber] == nil {
      guard let page = document.page(at: pageNumber - 1), let rendered = renderPage(page) else {
        fputs("Cannot render test \(testNumber) page \(pageNumber)\n", stderr)
        continue
      }
      renderedPages[pageNumber] = rendered
    }

    guard let rendered = renderedPages[pageNumber] else { continue }
    let crop = CGRect(x: spec.x * scale, y: spec.y * scale, width: spec.width * scale, height: spec.height * scale)
    guard let cropped = rendered.cropping(to: crop) else {
      fputs("Cannot crop test \(testNumber) question \(spec.question)\n", stderr)
      continue
    }

    let testFolder = outputRoot.appendingPathComponent(String(format: "test-%02d", testNumber))
    let outputURL = testFolder.appendingPathComponent(String(format: "q-%03d.png", spec.question))
    do {
      try writePng(cropped, to: outputURL)
      print("Wrote \(outputURL.path)")
    } catch {
      fputs("Cannot write \(outputURL.path): \(error)\n", stderr)
    }
  }
}
