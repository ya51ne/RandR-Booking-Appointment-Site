
// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger?.classList.remove('active');
    navMenu?.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background opacity on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'linear-gradient(135deg, rgba(245, 249, 245, 0.98) 0%, rgba(232, 244, 241, 0.98) 100%)';
    } else {
        navbar.style.background = 'linear-gradient(135deg, rgba(245, 249, 245, 0.95) 0%, rgba(232, 244, 241, 0.95) 100%)';
    }
});

// Set minimum date for booking to today
const dateInput = document.getElementById('date');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Booking form submission
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.classList.add('btn-loading');
        submitBtn.disabled = true;
        
        // Remove any existing messages
        const existingMessage = this.querySelector('.form-success, .form-error');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Collect form data
        const formData = new FormData(this);
        const selectedServices = formData.getAll('services');
        
        // Validate service selection
        if (selectedServices.length === 0) {
            const errorMessage = createMessage('error', 'Please select at least one service.');
            this.insertBefore(errorMessage, this.firstChild);
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
            return;
        }
        
        if (selectedServices.length > 10) {
            const errorMessage = createMessage('error', 'Please select no more than 10 services.');
            this.insertBefore(errorMessage, this.firstChild);
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
            return;
        }
        
        const bookingData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            services: selectedServices,
            date: formData.get('date'),
            message: formData.get('message') || 'No additional notes'
        };
        
        try {
            // Simulate form submission (replace with actual endpoint)
            await simulateBookingSubmission(bookingData);
            
            // Show success message
            const successMessage = createMessage('success', 
                'Booking request submitted successfully! Zeena will contact you within 24 hours to confirm your appointment.');
            this.insertBefore(successMessage, this.firstChild);
            
            // Reset form
            this.reset();
            
            // Scroll to top of form to show message
            this.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            // Show error message
            const errorMessage = createMessage('error', 
                'Sorry, there was an error submitting your booking. Please call 07561758019 directly to book your appointment.');
            this.insertBefore(errorMessage, this.firstChild);
        } finally {
            // Reset button state
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// Helper function to simulate booking submission
async function simulateBookingSubmission(data) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Log booking data (in real implementation, this would send to a server)
    console.log('Booking submitted:', data);
    
    // Create email link for fallback
    const servicesText = Array.isArray(data.services) ? data.services.join(', ') : data.services;
    const emailSubject = encodeURIComponent(`Booking Request - ${servicesText}`);
    const emailBody = encodeURIComponent(`
Hello Zeena,

I would like to book an appointment for the following:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Services: ${servicesText}
Preferred Date: ${data.date}
Additional Notes: ${data.message}

Please contact me to confirm the appointment.

Thank you!
    `);
    
    // For now, we'll just simulate success
    // In a real implementation, you could:
    // 1. Send to a backend API
    // 2. Use a service like Formspree or Netlify Forms
    // 3. Integrate with booking systems like Calendly
    
    return Promise.resolve();
}

// Helper function to create success/error messages
function createMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-${type}`;
    messageDiv.textContent = text;
    return messageDiv;
}

// Multiple services selection handling
const serviceCheckboxes = document.querySelectorAll('input[name="services"]');
const selectedCountElement = document.getElementById('selectedCount');
const estimatedTotalElement = document.getElementById('estimatedTotal');

if (serviceCheckboxes.length > 0) {
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleServiceSelection);
    });
}

function handleServiceSelection() {
    const checkedBoxes = document.querySelectorAll('input[name="services"]:checked');
    const count = checkedBoxes.length;
    
    // Update selected count
    if (selectedCountElement) {
        selectedCountElement.textContent = count;
    }
    
    // Calculate estimated total
    let total = 0;
    checkedBoxes.forEach(checkbox => {
        const price = parseInt(checkbox.dataset.price);
        total += price;
    });
    
    // Update estimated total display
    if (estimatedTotalElement) {
        if (count > 0) {
            estimatedTotalElement.textContent = `(Estimated total: From £${total})`;
        } else {
            estimatedTotalElement.textContent = '';
        }
    }
    
    // Enforce 1-10 services limit
    if (count >= 10) {
        // Disable unchecked boxes when 10 are selected
        serviceCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.disabled = true;
                checkbox.parentElement.style.opacity = '0.5';
            }
        });
    } else {
        // Re-enable all checkboxes if under the limit
        serviceCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
            checkbox.parentElement.style.opacity = '1';
        });
    }
}

// Form validation enhancement
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    // Email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.classList.add('error');
            isValid = false;
        }
    }
    
    // Phone validation (basic)
    const phoneField = form.querySelector('input[type="tel"]');
    if (phoneField && phoneField.value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(phoneField.value) || phoneField.value.length < 10) {
            phoneField.classList.add('error');
            isValid = false;
        }
    }
    
    return isValid;
}

// Add form validation styles
const style = document.createElement('style');
style.textContent = `
    .form-group input.error,
    .form-group select.error,
    .form-group textarea.error {
        border-color: #dc3545;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
`;
document.head.appendChild(style);

// Accordion functionality for FAQ page
function toggleAccordion(element) {
    const accordionItem = element.parentElement;
    const content = accordionItem.querySelector('.accordion-content');
    const isActive = accordionItem.classList.contains('active');
    
    // Close all other accordion items
    const allItems = document.querySelectorAll('.accordion-item');
    allItems.forEach(item => {
        if (item !== accordionItem) {
            item.classList.remove('active');
            const otherContent = item.querySelector('.accordion-content');
            if (otherContent) {
                otherContent.style.maxHeight = '0';
            }
        }
    });
    
    // Toggle current item
    if (isActive) {
        accordionItem.classList.remove('active');
        content.style.maxHeight = '0';
    } else {
        accordionItem.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 30 + 'px'; // Add extra space for increased padding
    }
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.service-category, .feature, .contact-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
