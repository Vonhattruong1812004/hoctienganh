import AppKit
import PDFKit

if CommandLine.arguments.count < 4 {
  fputs("Usage: render-pdf-page.swift <pdf-path> <page-number-1-based> <output-png> [scale]\n", stderr)
  exit(2)
}

let pdfPath = CommandLine.arguments[1]
let pageNumber = Int(CommandLine.arguments[2]) ?? 1
let outputPath = CommandLine.arguments[3]
let scale = CommandLine.arguments.count >= 5 ? (Double(CommandLine.arguments[4]) ?? 2.0) : 2.0

guard let document = PDFDocument(url: URL(fileURLWithPath: pdfPath)) else {
  fputs("Cannot open PDF: \(pdfPath)\n", stderr)
  exit(1)
}

guard let page = document.page(at: max(0, pageNumber - 1)) else {
  fputs("Cannot open page \(pageNumber). PDF has \(document.pageCount) pages.\n", stderr)
  exit(1)
}

let bounds = page.bounds(for: .mediaBox)
let width = Int(bounds.width * scale)
let height = Int(bounds.height * scale)
let image = NSImage(size: NSSize(width: width, height: height))

image.lockFocus()
guard let context = NSGraphicsContext.current?.cgContext else {
  fputs("Cannot create graphics context\n", stderr)
  exit(1)
}

NSColor.white.setFill()
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
context.saveGState()
context.scaleBy(x: scale, y: scale)
page.draw(with: .mediaBox, to: context)
context.restoreGState()
image.unlockFocus()

guard
  let tiffData = image.tiffRepresentation,
  let bitmap = NSBitmapImageRep(data: tiffData),
  let pngData = bitmap.representation(using: .png, properties: [:])
else {
  fputs("Cannot encode PNG\n", stderr)
  exit(1)
}

do {
  let url = URL(fileURLWithPath: outputPath)
  try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try pngData.write(to: url)
} catch {
  fputs("Cannot write PNG: \(error)\n", stderr)
  exit(1)
}
