const MiniSpinner = () => {
  // Common classes for the circles
  const circleCommonClasses = 'h-3 w-3 bg-blue-500 rounded-full m-1';

  return (
    <div
      id="SpinnerContainer"
      className="flex items-center justify-center pt-4">
      <div
        id="SpinnerCircle1"
        className={`${circleCommonClasses} animate-bounce`}
        style={{ animationDelay: '0s', animationDuration: '1s' }}></div>
      <div
        id="SpinnerCircle2"
        className={`${circleCommonClasses} animate-bounce`}
        style={{ animationDelay: '0.1s', animationDuration: '1s' }}></div>
      <div
        id="SpinnerCircle3"
        className={`${circleCommonClasses} animate-bounce`}
        style={{ animationDelay: '0.2s', animationDuration: '1s' }}></div>
      <div
        id="SpinnerCircle4"
        className={`${circleCommonClasses} animate-bounce`}
        style={{ animationDelay: '0.3s', animationDuration: '1s' }}></div>
    </div>
  );
};

// Export the Spinner component.
export default MiniSpinner;
