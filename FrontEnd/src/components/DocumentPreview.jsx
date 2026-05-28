import { useEffect, useRef, useState, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react'

function applyVariables(html, variables) {
  if (!variables || !html) return html
  return Object.entries(variables).reduce((acc, [key, val]) => {
    const safe = String(val ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    return acc.replaceAll(
      key,
      `<mark style="background:#fef9c3;color:#713f12;border-radius:3px;padding:0 2px;font-weight:600">${safe}</mark>`
    )
  }, html)
}

export function DocumentPreview({
  content = '',
  showHeader = false,
  variables = null,
  className
}) {
  const previewRef = useRef(null)
  const containerRef = useRef(null)
  const [zoom, setZoom] = useState(1)

  const resolvedContent = useMemo(() => applyVariables(content, variables), [content, variables])

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = DOMPurify.sanitize(resolvedContent || '')
    }
  }, [resolvedContent, showHeader])

  const handleZoomChange = (value) => {
    setZoom(value[0])
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.25))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Zoom Controls - Discreto */}
      <div className="mb-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
          className="h-7 w-7 p-0 text-text-tertiary hover:text-text-primary"
          title="Diminuir zoom"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Slider
          value={[zoom]}
          onValueChange={handleZoomChange}
          min={0.25}
          max={2}
          step={0.05}
          className="w-24"
        />
        <span className="text-xs text-text-tertiary min-w-[40px] text-right font-medium">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 2}
          className="h-7 w-7 p-0 text-text-tertiary hover:text-text-primary"
          title="Aumentar zoom"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResetZoom}
          className="h-7 w-7 p-0 text-text-tertiary hover:text-text-primary ml-1"
          title="Redefinir zoom para 100%"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Preview Container with Zoom - Fixed container */}
      <div 
        ref={containerRef}
        className="flex-1 border rounded-lg bg-[#F8F9FB] p-4 flex flex-col min-h-0"
        style={{ overflow: 'hidden' }}
      >
        {/* Scrollable content inside */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
        >
          {!content || content.trim() === '' || content.trim() === '<p></p>' ? (
            // Empty State
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm px-4">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 font-medium mb-2">
                  A visualização do documento aparecerá aqui
                </p>
                <p className="text-xs text-gray-400">
                  Conforme você edita o conteúdo, a prévia será atualizada em tempo real
                </p>
              </div>
            </div>
          ) : (
            <div 
              className="mx-auto transition-transform duration-150"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: `${100 / zoom}%`,
              }}
            >
              <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm print-area" style={{ width: '210mm', minHeight: '297mm' }}>
                {showHeader && (
                  <div className="border-b pb-4 mb-4">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold">Cabeçalho</h1>
                    </div>
                  </div>
                )}
                <div
                  ref={previewRef}
                  className="prose prose-sm max-w-none min-h-[500px] document-preview"
                  style={{
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

