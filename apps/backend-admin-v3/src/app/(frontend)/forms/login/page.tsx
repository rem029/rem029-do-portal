import { redirect } from 'next/navigation'

// The login flow is now handled via an inline modal on each protected form page.
// This route is kept for backwards compatibility and redirects to the forms index.
export default function FormLoginPage() {
  redirect('/forms')
}
