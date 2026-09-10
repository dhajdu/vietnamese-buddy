// components/seo/JsonLd.tsx
interface Props {
  schema: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Renders a JSON-LD structured data script tag.
 * Place in page.tsx or layout.tsx for schema coverage.
 *
 * @example
 * <JsonLd schema={websiteSchema()} />
 * <JsonLd schema={[websiteSchema(), organizationSchema()]} />
 */
export function JsonLd({ schema }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
