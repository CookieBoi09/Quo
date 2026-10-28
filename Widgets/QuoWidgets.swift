import AppIntents
import SwiftUI
import WidgetKit

struct QuoteEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Quote"
    static var defaultQuery = QuoteQuery()
    var id: String
    var title: String
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(title)") }
}

struct QuoteQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [QuoteEntity] {
        try all().filter { identifiers.contains($0.id) }
    }
    func suggestedEntities() async throws -> [QuoteEntity] { try all() }
    private func all() throws -> [QuoteEntity] {
        try LibraryDisk.shared().load().quotes.map { QuoteEntity(id: $0.id.uuidString, title: String($0.text.prefix(100))) }
    }
}

struct SelectQuoteIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Choose a quote"
    static var description = IntentDescription("Display a quote from your Quo library.")
    @Parameter(title: "Quote") var quote: QuoteEntity?
}

struct QuoteEntry: TimelineEntry {
    var date: Date
    var quote: Quote?
    var message: String = "Edit this widget to choose a quote from Quo."
}

struct QuoteProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> QuoteEntry {
        QuoteEntry(date: .now, quote: Quote(text: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh"))
    }
    func snapshot(for configuration: SelectQuoteIntent, in context: Context) async -> QuoteEntry {
        if context.isPreview { return placeholder(in: context) }
        return entry(configuration)
    }
    func timeline(for configuration: SelectQuoteIntent, in context: Context) async -> Timeline<QuoteEntry> {
        Timeline(entries: [entry(configuration)], policy: .after(Date.now.addingTimeInterval(3600)))
    }
    private func entry(_ configuration: SelectQuoteIntent) -> QuoteEntry {
        do {
            let library = try LibraryDisk.shared().load()
            let quote = library.quotes.first { $0.id.uuidString == configuration.quote?.id }
            return QuoteEntry(date: .now, quote: quote, message: configuration.quote == nil ? "Edit this widget to choose a quote from Quo." : "This quote is no longer available. Edit the widget to choose another.")
        } catch {
            return QuoteEntry(date: .now, quote: nil, message: "Open Quo to check your library and shared storage.")
        }
    }
}

struct QuoWidget: Widget {
    let kind = "QuoQuote"
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: SelectQuoteIntent.self, provider: QuoteProvider()) { entry in
            Group {
                if let quote = entry.quote { QuoteCanvas(quote: quote) }
                else {
                    VStack(spacing: 10) {
                        Image(systemName: "quote.opening").font(.title)
                        Text(entry.message).font(.caption).multilineTextAlignment(.center)
                    }.padding().foregroundStyle(.white)
                }
            }
            .containerBackground(for: .widget) { Color(red: 0.12, green: 0.22, blue: 0.20) }
        }
        .configurationDisplayName("Words worth keeping")
        .description("Your quote, your photo, your font.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge])
        .contentMarginsDisabled()
        .containerBackgroundRemovable(false)
    }
}

@main
struct QuoWidgetBundle: WidgetBundle {
    var body: some Widget { QuoWidget() }
}
