import AppKit
import PDFKit

let repoRoot = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let pdfURL = repoRoot.appendingPathComponent("ETS/ETS 2026- RC.pdf")
let outputRoot = repoRoot.appendingPathComponent("apps/web/public/ets/part6-groups")
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
  CropSpec(from: 131, to: 134, pageOffset: 4, x: 118, y: 330, width: 990, height: 1220),
  CropSpec(from: 135, to: 138, pageOffset: 5, x: 130, y: 105, width: 980, height: 1400),
  CropSpec(from: 139, to: 142, pageOffset: 6, x: 125, y: 112, width: 975, height: 1400),
  CropSpec(from: 143, to: 146, pageOffset: 7, x: 150, y: 110, width: 965, height: 1390),
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
    throw NSError(domain: "GenerateEtsPart6Groups", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot encode PNG"])
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
      fputs("Cannot crop test \(testNumber) questions \(spec.from)-\(spec.to)\n", stderr)
      continue
    }

    let testFolder = outputRoot.appendingPathComponent(String(format: "test-%02d", testNumber))
    let outputURL = testFolder.appendingPathComponent(String(format: "q-%03d-%03d.png", spec.from, spec.to))
    do {
      try writePng(cropped, to: outputURL)
      print("Wrote \(outputURL.path)")
    } catch {
      fputs("Cannot write \(outputURL.path): \(error)\n", stderr)
    }
  }
}
