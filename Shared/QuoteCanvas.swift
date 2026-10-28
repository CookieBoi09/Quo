import SwiftUI
import UIKit

struct QuoteCanvas: View {
    let quote: Quote
    var photoData: Data? = nil

    private var image: UIImage? {
        if let photoData { return UIImage(data: photoData) }
        guard let name = quote.photoName,
              let disk = try? LibraryDisk.shared(),
              let url = disk.photoURL(name) else { return nil }
        return UIImage(contentsOfFile: url.path)
    }

    private var alignment: TextAlignment {
        switch quote.alignment {
        case .leading: return .leading
        case .center: return .center
        case .trailing: return .trailing
        }
    }

    var body: some View {
        GeometryReader { geometry in
            let inset = max(12.0, min(geometry.size.width, geometry.size.height) * 0.09)
            let available = max(1, (geometry.size.width - inset * 2) * (geometry.size.height - inset * 2))
            let fontSize = min(58.0, max(12.0, sqrt(available / Double(max(quote.text.count, 12))) * 1.12))
            ZStack {
                if let image {
                    Image(uiImage: image).resizable().scaledToFill()
                        .frame(width: geometry.size.width, height: geometry.size.height).clipped()
                } else {
                    LinearGradient(colors: [Color(red: 0.19, green: 0.29, blue: 0.28), Color(red: 0.07, green: 0.14, blue: 0.16)], startPoint: .topLeading, endPoint: .bottomTrailing)
                }
                Color.black.opacity(quote.overlay)
                VStack(spacing: 10) {
                    Text(quote.text.isEmpty ? "Your words, beautifully kept." : quote.text)
                        .font(.custom(quote.fontName, fixedSize: fontSize))
                        .multilineTextAlignment(alignment)
                        .minimumScaleFactor(0.08)
                        .lineLimit(40)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .layoutPriority(1)
                    if !quote.author.isEmpty {
                        Text("— " + quote.author)
                            .font(.system(size: min(15, fontSize * 0.55), weight: .medium))
                            .lineLimit(2).minimumScaleFactor(0.4)
                    }
                }
                .foregroundStyle(.white)
                .padding(inset)
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .clipped()
        }
        .accessibilityElement(children: .combine)
    }
}
