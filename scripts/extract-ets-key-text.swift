import Foundation
import PDFKit

guard CommandLine.arguments.count >= 2 else {
  fputs("Usage: swift scripts/extract-ets-key-text.swift <pdf-path>\n", stderr)
  exit(1)
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let document = PDFDocument(url: url) else {
  fputs("Cannot open PDF: \(url.path)\n", stderr)
  exit(1)
}

for pageIndex in 0..<document.pageCount {
  guard let pageText = document.page(at: pageIndex)?.string, !pageText.isEmpty else { continue }
  print("\n--- PAGE \(pageIndex + 1) ---")
  print(pageText)
}
