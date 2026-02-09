import React from 'react';
import './Roadmap.css';

const Roadmap = () => {
  const steps = [
    {
      step: 1,
      title: 'Assessment & Onboarding',
      description: 'Initial student assessment to determine learning level and style. School and teacher onboarding process.',
      duration: '1-2 weeks'
    },
    {
      step: 2,
      title: 'Personalized Learning Path',
      description: 'AI creates customized learning journey based on assessment results and educational goals.',
      duration: 'Ongoing'
    },
    {
      step: 3,
      title: 'Adaptive Learning Sessions',
      description: 'Engaging learning modules that adjust difficulty based on student performance in real-time.',
      duration: 'Daily sessions'
    },
    {
      step: 4,
      title: 'Incentive & Reward System',
      description: 'Students earn points, badges, and rewards for completing milestones and showing improvement.',
      duration: 'Continuous'
    },
    {
      step: 5,
      title: 'Progress Monitoring',
      description: 'Teachers and administrators track progress through comprehensive analytics dashboards.',
      duration: 'Real-time'
    },
    {
      step: 6,
      title: 'Success & Advancement',
      description: 'Students advance to higher levels, with preparation for standardized tests and future academic challenges.',
      duration: 'Quarterly reviews'
    }
  ];

  return (
    <section id="roadmap" className="section roadmap">
      <div className="container">
        <h2 className="section-title">Learning Journey Roadmap</h2>
        <div className="roadmap-timeline">
          {steps.map((step, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker">{step.step}</div>
              <div className="timeline-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="timeline-duration">{step.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;