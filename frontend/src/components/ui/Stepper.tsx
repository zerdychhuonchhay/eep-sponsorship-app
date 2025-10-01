import React from 'react';

interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, activeStep, className }) => {
  return (
    <div className={`w-full px-4 sm:px-8 ${className || ''}`}>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold ${
                    isActive ? 'bg-primary text-white' : isCompleted ? 'bg-success text-white' : 'bg-gray-3 dark:bg-box-dark-2'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className={`mt-2 text-xs text-center ${isActive ? 'font-semibold text-primary' : 'text-body-color'}`}>
                    {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-auto border-t-2 transition-colors duration-500 ${
                    isCompleted ? 'border-success' : 'border-gray-3 dark:border-box-dark-2'
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
