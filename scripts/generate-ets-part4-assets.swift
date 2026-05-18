import AppKit
import PDFKit

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let pdfURL = repoRoot.appendingPathComponent("ETS/ETS 2026- LC.pdf")
let outputRoot = repoRoot.appendingPathComponent("apps/web/public/ets/part4")
let scale: CGFloat = 2.0

struct CropSpec {
  let from: Int
  let to: Int
  let pageOffset: Int
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat
}

let specs: [CropSpec] = [
  CropSpec(from: 71, to: 73, pageOffset: 10, x: 62, y: 158, width: 238, height: 265),
  CropSpec(from: 74, to: 76, pageOffset: 10, x: 62, y: 425, width: 238, height: 285),
  CropSpec(from: 77, to: 79, pageOffset: 10, x: 305, y: 158, width: 242, height: 270),
  CropSpec(from: 80, to: 82, pageOffset: 10, x: 305, y: 430, width: 242, height: 285),
  CropSpec(from: 83, to: 85, pageOffset: 11, x: 70, y: 45, width: 246, height: 270),
  CropSpec(from: 86, to: 88, pageOffset: 11, x: 70, y: 315, width: 246, height: 295),
  CropSpec(from: 89, to: 91, pageOffset: 11, x: 315, y: 45, width: 245, height: 275),
  CropSpec(from: 92, to: 94, pageOffset: 11, x: 315, y: 320, width: 245, height: 300),
  CropSpec(from: 95, to: 97, pageOffset: 12, x: 70, y: 40, width: 232, height: 445),
  CropSpec(from: 98, to: 100, pageOffset: 12, x: 300, y: 40, width: 250, height: 375),
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
    throw NSError(domain: "GenerateEtsPart4", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot encode PNG"])
  }
  try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try data.write(to: url)
}

for testNumber in 1...10 {
  let testStartPage = 1 + (testNumber - 1) * 14
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
      fputs("Cannot crop test \(testNumber) questions \(spec.from)-\(spec.to)\n", stderr)
      continue
    }

    let testFolder = outputRoot.appendingPathComponent(String(format: "test-%02d", testNumber))
    let outputURL = testFolder.appendingPathComponent(String(format: "q-%02d-%02d.png", spec.from, spec.to))
    do {
      try writePng(cropped, to: outputURL)
      print("Wrote \(outputURL.path)")
    } catch {
      fputs("Cannot write \(outputURL.path): \(error)\n", stderr)
    }
  }
}
