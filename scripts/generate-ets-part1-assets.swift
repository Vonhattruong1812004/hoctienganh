import AppKit
import PDFKit

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let pdfURL = repoRoot.appendingPathComponent("ETS/ETS 2026- LC.pdf")
let outputRoot = repoRoot.appendingPathComponent("apps/web/public/ets/part1")

struct CropSpec {
  let questionOffset: Int
  let pageOffset: Int
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat
}

let specs: [CropSpec] = [
  CropSpec(questionOffset: 1, pageOffset: 2, x: 95, y: 40, width: 330, height: 350),
  CropSpec(questionOffset: 2, pageOffset: 2, x: 60, y: 440, width: 410, height: 285),
  CropSpec(questionOffset: 3, pageOffset: 3, x: 88, y: 48, width: 420, height: 305),
  CropSpec(questionOffset: 4, pageOffset: 3, x: 88, y: 418, width: 420, height: 325),
  CropSpec(questionOffset: 5, pageOffset: 4, x: 84, y: 45, width: 410, height: 270),
  CropSpec(questionOffset: 6, pageOffset: 4, x: 84, y: 360, width: 410, height: 315),
]

guard let document = PDFDocument(url: pdfURL) else {
  fputs("Cannot open PDF: \(pdfURL.path)\n", stderr)
  exit(1)
}

func renderPage(_ page: PDFPage) -> CGImage? {
  let bounds = page.bounds(for: .mediaBox)
  let width = Int(bounds.width)
  let height = Int(bounds.height)
  let image = NSImage(size: NSSize(width: width, height: height))

  image.lockFocus()
  guard let context = NSGraphicsContext.current?.cgContext else {
    image.unlockFocus()
    return nil
  }
  NSColor.white.setFill()
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  page.draw(with: .mediaBox, to: context)
  image.unlockFocus()

  guard let tiffData = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiffData) else {
    return nil
  }
  return bitmap.cgImage
}

func writePng(_ image: CGImage, to url: URL) throws {
  let bitmap = NSBitmapImageRep(cgImage: image)
  guard let data = bitmap.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "GenerateEtsPart1", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot encode PNG"])
  }
  try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try data.write(to: url)
}

for testNumber in 1...10 {
  let testStartPage = 1 + (testNumber - 1) * 14
  for spec in specs {
    let pageNumber = testStartPage + spec.pageOffset
    guard let page = document.page(at: pageNumber - 1), let rendered = renderPage(page) else {
      fputs("Cannot render test \(testNumber) page \(pageNumber)\n", stderr)
      continue
    }

    let crop = CGRect(x: spec.x, y: spec.y, width: spec.width, height: spec.height)
    guard let cropped = rendered.cropping(to: crop) else {
      fputs("Cannot crop test \(testNumber) question \(spec.questionOffset)\n", stderr)
      continue
    }

    let testFolder = outputRoot.appendingPathComponent(String(format: "test-%02d", testNumber))
    let outputURL = testFolder.appendingPathComponent(String(format: "q-%02d.png", spec.questionOffset))
    do {
      try writePng(cropped, to: outputURL)
      print("Wrote \(outputURL.path)")
    } catch {
      fputs("Cannot write \(outputURL.path): \(error)\n", stderr)
    }
  }
}
