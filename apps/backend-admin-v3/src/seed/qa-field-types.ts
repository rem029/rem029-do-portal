import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

const createLexicalRichText = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            mode: 'normal',
            text,
            type: 'text',
            style: '',
            detail: 0,
            format: 0,
            version: 1,
          },
        ],
        direction: null,
        textStyle: '',
        textFormat: 0,
      },
    ],
    direction: null,
  },
})

export const seedQaFieldTypes = async ({ payload }: { payload: Payload }): Promise<void> => {
  payload.logger.info('[seedQaFieldTypes] seeding qa-field-types...')

  try {
    const operatorResult = await payload.find({
      collection: 'operators',
      where: { slug: { equals: 'doha-oasis' } },
      limit: 1,
      overrideAccess: true,
    })

    const operator = operatorResult.docs[0]
    if (!operator) {
      payload.logger.error('[seedQaFieldTypes] Operator "doha-oasis" not found — skipping.')
      return
    }

    // Look up an optional department for relationships
    const deptResult = await payload.find({
      collection: 'departments',
      limit: 1,
      overrideAccess: true,
    })
    const deptId = deptResult.docs[0]?.id

    // Look up an optional media for upload field
    const mediaResult = await payload.find({
      collection: 'media',
      limit: 1,
      overrideAccess: true,
    })
    const mediaId = mediaResult.docs[0]?.id

    // 1. Root Document
    const rootSlug = 'qa-showcase-root'
    const existingRoot = await payload.find({
      collection: 'qa-field-types',
      where: { slug: { equals: rootSlug } },
      limit: 1,
      overrideAccess: true,
    })

    let rootId: string | number

    if (existingRoot.totalDocs > 0) {
      payload.logger.info(`[seedQaFieldTypes] "${rootSlug}" already exists — skipping creation.`)
      rootId = existingRoot.docs[0]!.id
    } else {
      const createdRoot = await payload.create({
        collection: 'qa-field-types',
        data: {
          title: 'QA Showcase Root',
          slug: rootSlug,
          operator: operator.id,
          operator_slug: `doha-oasis-${rootSlug}`,
          textarea_field:
            'This is a sample multiline description demonstrating the textarea field styling and text wrapping in both light and dark themes.',
          email_field: 'qa-root@doha-oasis.com',
          number_field: 42,
          date_field: '2026-09-19T10:00:00.000Z',
          checkbox_field: true,
          select_single: 'alpha',
          select_multi: ['red', 'blue'],
          radio_field: 'choice_1',
          ...(deptId ? { relationship_single: deptId, relationship_multi: [deptId] } : {}),
          parent: null,
          rich_text_field: createLexicalRichText(
            'Welcome to the QA Field Types showcase document. This rich text content tests paragraph rendering and theming.',
          ),
          ...(mediaId ? { upload_field: mediaId } : {}),
          code_field: '{\n  "name": "qa-showcase-root",\n  "version": "1.0.0",\n  "active": true\n}',
          json_field: {
            environment: 'development',
            themeQA: { phase: 9, darkModeReady: true, testSuite: 'TECH-0112' },
          },
          array_field: [
            { item_name: 'Alpha Row', item_value: 100 },
            { item_name: 'Beta Row', item_value: 200 },
          ],
          blocks_field: [
            {
              blockType: 'content_block',
              heading: 'Welcome to QA Testing',
              body: 'Demonstrating content block styling within the blocks field.',
            },
            {
              blockType: 'alert_block',
              level: 'info',
              message: 'Notice: this is an informational banner block inside the blocks field.',
            },
          ],
          group_field: {
            group_text_1: 'Primary Group Text Value',
            group_text_2: 'Secondary Group Text Value',
          },
          row_col_1: 'Left Column Text',
          row_col_2: 'Right Column Text',
          collapsible_field_1: 'Visible text inside collapsible container',
          collapsible_field_2: 'Additional notes inside collapsible container',
          tab_alpha_text: 'Tab Alpha content string',
          tab_beta_notes: 'Tab Beta multiline notes content',
        } as unknown as RequiredDataFromCollectionSlug<'qa-field-types'>,
        overrideAccess: true,
      })

      rootId = createdRoot.id
      payload.logger.info(`[seedQaFieldTypes] ✓ created "${rootSlug}" (id: ${rootId})`)
    }

    // 2. Child Document Alpha (points to rootId via parent field)
    const childAlphaSlug = 'qa-child-alpha'
    const existingChildAlpha = await payload.find({
      collection: 'qa-field-types',
      where: { slug: { equals: childAlphaSlug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingChildAlpha.totalDocs > 0) {
      payload.logger.info(`[seedQaFieldTypes] "${childAlphaSlug}" already exists — skipping.`)
    } else {
      await payload.create({
        collection: 'qa-field-types',
        data: {
          title: 'QA Child Alpha',
          slug: childAlphaSlug,
          operator: operator.id,
          operator_slug: `doha-oasis-${childAlphaSlug}`,
          textarea_field: 'First child node linked to the root document to exercise Join display.',
          email_field: 'qa-child-alpha@doha-oasis.com',
          number_field: 17,
          date_field: '2026-09-18T14:30:00.000Z',
          checkbox_field: false,
          select_single: 'beta',
          select_multi: ['green'],
          radio_field: 'choice_2',
          ...(deptId ? { relationship_single: deptId, relationship_multi: [deptId] } : {}),
          parent: rootId,
          rich_text_field: createLexicalRichText('Child Alpha notes and description.'),
          ...(mediaId ? { upload_field: mediaId } : {}),
          code_field: 'const status = "child_alpha_ready";',
          json_field: { role: 'child_node', rank: 1 },
          array_field: [{ item_name: 'Child Item 1', item_value: 50 }],
          blocks_field: [
            {
              blockType: 'alert_block',
              level: 'warning',
              message: 'Warning: child node testing alert block.',
            },
          ],
          group_field: {
            group_text_1: 'Child Alpha Group 1',
            group_text_2: 'Child Alpha Group 2',
          },
          row_col_1: 'Child Row Left',
          row_col_2: 'Child Row Right',
          collapsible_field_1: 'Child collapsible text',
          collapsible_field_2: 'Child collapsible notes',
          tab_alpha_text: 'Child Alpha Tab text',
          tab_beta_notes: 'Child Alpha Tab notes',
        } as unknown as RequiredDataFromCollectionSlug<'qa-field-types'>,
        overrideAccess: true,
      })

      payload.logger.info(`[seedQaFieldTypes] ✓ created "${childAlphaSlug}" (parent: ${rootId})`)
    }

    // 3. Child Document Beta (points to rootId via parent field)
    const childBetaSlug = 'qa-child-beta'
    const existingChildBeta = await payload.find({
      collection: 'qa-field-types',
      where: { slug: { equals: childBetaSlug } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingChildBeta.totalDocs > 0) {
      payload.logger.info(`[seedQaFieldTypes] "${childBetaSlug}" already exists — skipping.`)
    } else {
      await payload.create({
        collection: 'qa-field-types',
        data: {
          title: 'QA Child Beta',
          slug: childBetaSlug,
          operator: operator.id,
          operator_slug: `doha-oasis-${childBetaSlug}`,
          textarea_field: 'Second child node linked to the root document to exercise Join display.',
          email_field: 'qa-child-beta@doha-oasis.com',
          number_field: 99,
          date_field: '2026-09-17T09:15:00.000Z',
          checkbox_field: true,
          select_single: 'gamma',
          select_multi: ['red', 'green', 'blue'],
          radio_field: 'choice_3',
          ...(deptId ? { relationship_single: deptId, relationship_multi: [deptId] } : {}),
          parent: rootId,
          rich_text_field: createLexicalRichText('Child Beta rich text content with full options.'),
          ...(mediaId ? { upload_field: mediaId } : {}),
          code_field: 'function testBeta() { return true; }',
          json_field: { role: 'child_node', rank: 2 },
          array_field: [{ item_name: 'Child Item 2', item_value: 75 }],
          blocks_field: [
            {
              blockType: 'content_block',
              heading: 'Child Beta Heading',
              body: 'Content inside Child Beta.',
            },
          ],
          group_field: {
            group_text_1: 'Child Beta Group 1',
            group_text_2: 'Child Beta Group 2',
          },
          row_col_1: 'Beta Row Col 1',
          row_col_2: 'Beta Row Col 2',
          collapsible_field_1: 'Beta Collapsible text',
          collapsible_field_2: 'Beta Collapsible notes',
          tab_alpha_text: 'Beta Tab Alpha',
          tab_beta_notes: 'Beta Tab Beta',
        } as unknown as RequiredDataFromCollectionSlug<'qa-field-types'>,
        overrideAccess: true,
      })

      payload.logger.info(`[seedQaFieldTypes] ✓ created "${childBetaSlug}" (parent: ${rootId})`)
    }
  } catch (error) {
    console.error('Error creating QA field types seed:', error)
    throw error
  }
}
