import { useState, useEffect } from 'react';
import { SectionHeader } from './SectionHeader';
import { StepCard } from './StepCard';
import { Check } from 'lucide-react';

export function JetStepsSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: '01',
      label: 'SIGN UP',
      title: 'Create your account',
      description: 'Sign up in seconds with your email or Google account. No credit card required to start.'
    },
    {
      number: '02',
      label: 'CHOOSE',
      title: 'Select your AI employees',
      description: 'Pick from our roster of specialized AI employees. Add as many as you need for your team.'
    },
    {
      number: '03',
      label: 'DEPLOY',
      title: 'Start working instantly',
      description: 'Your AI workforce is ready to go. Start delegating tasks and watch productivity soar.'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-[#0B0E13] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#4AF2FF]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] relative z-10">
        <SectionHeader
          overline="GET STARTED IN 3 SIMPLE STEPS"
          title="Up and running in minutes"
          description="No complex setup. No training required. Just sign up and start delegating work to your AI team."
          centered
          className="mb-20"
        />

        {/* Timeline visual */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${index <= activeStep 
                    ? 'bg-gradient-to-br from-[#F7FF5C] to-[#4AF2FF]' 
                    : 'bg-[#10141E] border border-[#222633]'
                  }
                `}>
                  {index < activeStep ? (
                    <Check className="w-6 h-6 text-[#050509]" />
                  ) : (
                    <span className={`label-s ${index === activeStep ? 'text-[#050509]' : 'text-[#A6A7B0]'}`}>
                      {step.number}
                    </span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-24 h-1 mx-2 rounded-full transition-all duration-300
                    ${index < activeStep 
                      ? 'bg-gradient-to-r from-[#F7FF5C] to-[#4AF2FF]' 
                      : 'bg-[#222633]'
                    }
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              stepNumber={step.number}
              stepLabel={step.label}
              title={step.title}
              description={step.description}
              isActive={index === activeStep}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
