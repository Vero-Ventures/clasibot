import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
  isOpen: boolean;
  id?: string;
}

const Section: React.FC<SectionProps> = ({
  title,
  children,
  onClick,
  isOpen,
  id,
}) => (
  <section
    className="mb-8 transform rounded-lg bg-white px-8 py-6 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl"
    id={id}>
    <div
      className="mb-4 cursor-pointer text-center"
      role="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-controls={`${id}-content`}>
      <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
    </div>
    <div
      id={`${id}-content`}
      className={`transition-max-height overflow-hidden duration-500 ease-in-out ${
        isOpen ? 'max-h-screen' : 'max-h-0'
      }`}>
      {children}
    </div>
  </section>
);

export default Section;
