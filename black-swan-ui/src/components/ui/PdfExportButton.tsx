import type React from "react"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

type PdfExportButtonProps = {
    targetRef: React.RefObject<HTMLDivElement | null>
    filename?: string
  }

const PdfExportButton: React.FC<PdfExportButtonProps> = ({ targetRef, filename = "stress-test-results.pdf" }) => {
  const handleExport = async () => {
    if (targetRef.current) {
      try {
        const canvas = await html2canvas(targetRef.current)
        const imgData = canvas.toDataURL("image/png")
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [canvas.width, canvas.height],
        })
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
        pdf.save(filename)
      } catch (error) {
        console.error("Error generating PDF:", error)
        alert("Failed to generate PDF. Please try again.")
      }
    } else {
      console.error("Target element not found")
      alert("Failed to generate PDF. Target element not found.")
    }
  }

  return (
    <Button onClick={handleExport} className="mt-4">
      <FileDown className="mr-2 h-4 w-4" /> Export as PDF
    </Button>
  )
}

export default PdfExportButton

