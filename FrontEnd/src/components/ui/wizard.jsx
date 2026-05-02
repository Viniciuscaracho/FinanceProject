import { useState } from 'react'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export function Wizard({ 
  steps, 
  onComplete, 
  initialStep = 0,
  className,
  ...props 
}) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState(new Set())

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (index) => {
    // Permitir navegar para qualquer step (navegação livre)
    setCurrentStep(index)
    // Marcar como completo se já passou por ele
    if (index < currentStep) {
      setCompletedSteps(prev => new Set([...prev, index]))
    }
  }

  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 gap-1 sm:gap-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(index)
            const isCurrent = index === currentStep
            // Permitir acesso a qualquer step (navegação livre)
            const isAccessible = true

            return (
              <div key={index} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <button
                    onClick={() => handleStepClick(index)}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all duration-200 flex-shrink-0 cursor-pointer",
                      isCurrent 
                        ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md scale-105 sm:scale-110"
                        : isCompleted
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-105"
                    )}
                    title={`Ir para: ${step.title}`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      index + 1
                    )}
                  </button>
                  <p className={cn(
                    "text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center truncate w-full px-0.5 cursor-pointer",
                    isCurrent ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                  onClick={() => handleStepClick(index)}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-1 sm:mx-2 transition-all duration-300 min-w-[8px]",
                    isCompleted || index < currentStep
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[250px] sm:min-h-[300px]">
        {steps[currentStep].content}
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={isFirstStep}
          className="flex items-center justify-center gap-2 order-2 sm:order-1 w-full sm:w-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
          <span className="sm:hidden">Voltar</span>
        </Button>

        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center order-1 sm:order-2">
          Passo {currentStep + 1} de {steps.length}
        </div>

        {isLastStep ? (
          <Button
            onClick={onComplete}
            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white flex items-center justify-center gap-2 order-3 w-full sm:w-auto"
          >
            <span>Concluir</span>
            <Check className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white flex items-center justify-center gap-2 order-3 w-full sm:w-auto"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

