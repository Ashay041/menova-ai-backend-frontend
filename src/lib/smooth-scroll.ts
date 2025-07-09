export function setupSmoothScrolling() {
  // Get all anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  
  // Add click event listener to each anchor link
  anchorLinks.forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Smooth scroll to the target element
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without page reload
        window.history.pushState(null, '', targetId);
      }
    });
  });
}
