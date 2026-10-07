import { CollectionBeforeChangeHook } from "payload"

const setDefaultFormStatus: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
    if (operation === 'create' && !data.form_status) {
        const formId = typeof data.form === 'object' ? data.form?.id : data.form
        if (formId) {
            try {
                const form = await req.payload.findByID({
                    collection: 'forms',
                    id: formId,
                    depth: 0,
                    overrideAccess: true,
                })

                if (form?.enable_form_status && Array.isArray(form.form_statuses)) {
                    const defaultStatus = form.form_statuses.find((s: any) => s.is_default)
                    if (defaultStatus?.value) {
                        data.form_status = defaultStatus.value
                    }
                }
            } catch (err) {
                req.payload.logger.error(`Error setting default form_status: ${err}`)
            }
        }
    }
    return data
}

export default setDefaultFormStatus