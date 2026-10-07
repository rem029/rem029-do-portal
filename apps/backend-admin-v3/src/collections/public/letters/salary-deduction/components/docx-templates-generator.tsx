'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { saveAs } from 'file-saver'
import { useField } from '@payloadcms/ui'
import createReport from 'docx-templates'
// @ts-ignore
import { lexicalToHtml } from '@/utilities/lexical-converter'
import { fetchSettingsAndMediaAction } from './actions'

const DocxTemplatesGenerator = () => {
  // Fetch data from collection fields
  const { value: employeeName } = useField<string>({ path: 'employee_name' })
  const { value: employeeId } = useField<string>({ path: 'employee_h2a_id' })
  const { value: employeeDesignation } = useField<string>({ path: 'employee_designation' })
  const { value: employeeDepartmentName } = useField<string>({ path: 'employee_department_name' })

  const { value: employeeEmail } = useField<string>({ path: 'employee_email' })
  const { value: subject } = useField<string>({ path: 'subject' })
  const { value: descriptionIntroRichText } = useField<any>({ path: 'description' })
  const { value: createdAt } = useField<string>({ path: 'createdAt' })

  const [templateUrl, setTemplateUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load department name and template URL
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsProcessing(true)
        const data = await fetchSettingsAndMediaAction()
        if (data.docxTemplateUrl) {
          setTemplateUrl(data.docxTemplateUrl)
        }

        setIsProcessing(false)
      } catch (error) {
        setIsProcessing(false)
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  const generateDocument = useCallback(async () => {
    if (!templateUrl) {
      setError('Template not configured. Please upload a template in Salary Deduction Settings.')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(false)

    try {
      // Fetch the template
      const templateResponse = await fetch(templateUrl)
      if (!templateResponse.ok) {
        throw new Error('Failed to load template file from settings')
      }
      const templateBuffer = await templateResponse.arrayBuffer()

      // Format date
      const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

      // 1. Convert Lexical to HTML
      let introHtml = lexicalToHtml(descriptionIntroRichText)

      // Wrap in proper HTML shell for docx-templates HTML feature
      if (introHtml) {
        introHtml = `
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10pt;
          line-height: 1.5;
        }
      </style>
      <body>${introHtml}</body>`
      }

      // 2. Convert HTML to DOCX (as a sub-document or buffer if supported)

      const templateData = {
        staff_name: employeeName || 'Not provided',
        staff_no: employeeId || 'Not provided',
        designation: employeeDesignation || 'Not provided',
        department: employeeDepartmentName || 'Not provided',
        subject: subject || 'Not provided',
        description: introHtml || 'Not provided', // Passing HTML
        date: formattedDate,
        email: employeeEmail || 'Not provided',
      }

      const report = await createReport({
        template: new Uint8Array(templateBuffer),
        data: templateData,
        cmdDelimiter: ['{', '}'],
        // docx-templates supports HTML via a specific command in the template
        // e.g. +++HTML description_intro+++
      })

      // Save document
      const filename = `Salary_Deduction_${(employeeName || 'record').replace(/\s+/g, '_')}_${employeeId || 'no_id'}_v2.docx`
      saveAs(
        new Blob([report as any], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
        filename,
      )

      setSuccess(true)
    } catch (err) {
      console.error('Document generation error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to generate document. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }, [
    employeeName,
    employeeId,
    employeeDesignation,
    employeeDepartmentName,
    subject,
    descriptionIntroRichText,
    createdAt,
    employeeEmail,
    templateUrl,
  ])

  return (
    <div className="flex flex-col gap-4 border-t pt-4">
      <button
        type="button"
        onClick={generateDocument}
        disabled={isProcessing}
        className={`btn btn-sm ${
          isProcessing || !employeeName || !employeeId ? 'btn-disabled' : 'btn-primary'
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Generating...
          </span>
        ) : (
          <span className="underline flex items-center gap-2">
            <span>📝</span>
            Generate & Download Word Document
          </span>
        )}
      </button>

      {error && (
        <div className="alert alert-error shadow-lg">
          <div>
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success shadow-lg">
          <div>
            <span>Document downloaded successfully.</span>
          </div>
        </div>
      )}

      <div className="text-xs">
        <p className="font-semibold mb-2">Template Syntax (docx-templates):</p>
        <p className="mb-2">
          <code>{`{staff_name}, {staff_no}, {designation}, {department}, {subject}, {HTML description}`}</code>
        </p>
      </div>
    </div>
  )
}

export default DocxTemplatesGenerator
