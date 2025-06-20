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
    anchor.addEventListener('click', function(e) {
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

// Navbar background opacity on scroll - cached navbar element
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.background = 'linear-gradient(135deg, rgba(245, 249, 245, 0.98) 0%, rgba(232, 244, 241, 0.98) 100%)';
        } else {
            navbar.style.background = 'linear-gradient(135deg, rgba(245, 249, 245, 0.95) 0%, rgba(232, 244, 241, 0.95) 100%)';
        }
    }
});

// Time slot availability tracking for cupping treatments
let bookedCuppingSlots = {};

// Function to load booked cupping slots from localStorage or server
function loadBookedCuppingSlots() {
    const stored = localStorage.getItem('bookedCuppingSlots');
    if (stored) {
        bookedCuppingSlots = JSON.parse(stored);
    }
}

// Function to save booked cupping slots
function saveBookedCuppingSlots() {
    localStorage.setItem('bookedCuppingSlots', JSON.stringify(bookedCuppingSlots));
}

// Function to check if a service is a cupping treatment
function isCuppingService(service) {
    return service.toLowerCase().includes('cupping') || service.toLowerCase().includes('hijama');
}

// Function to check if selected services include cupping
function hasCuppingServices(selectedServices) {
    return selectedServices.some(service => isCuppingService(service));
}

// Function to mark time slot as booked for cupping
function markCuppingSlotAsBooked(date, timeSlot) {
    if (!bookedCuppingSlots[date]) {
        bookedCuppingSlots[date] = [];
    }
    if (!bookedCuppingSlots[date].includes(timeSlot)) {
        bookedCuppingSlots[date].push(timeSlot);
        saveBookedCuppingSlots();
    }
}

// Function to check if a time slot is booked for cupping
function isCuppingSlotBooked(date, timeSlot) {
    return bookedCuppingSlots[date] && bookedCuppingSlots[date].includes(timeSlot);
}

// Function to update time slot availability based on cupping bookings
function updateTimeSlotAvailability(selectedDate) {
    const options = timeSlotSelect.querySelectorAll('option');

    options.forEach(option => {
        if (option.value) {
            const isBookedForCupping = isCuppingSlotBooked(selectedDate, option.value);

            if (isBookedForCupping) {
                option.disabled = true;
                option.style.color = '#ccc';
                option.textContent = option.textContent.replace(' (Unavailable)', '') + ' (Unavailable)';
            } else {
                // Only enable if not disabled by other conditions (like past time)
                const selectedDate = new Date(dateInput.value);
                const today = new Date();
                const isToday = selectedDate.toDateString() === today.toDateString();

                if (isToday) {
                    const currentHour = today.getHours();
                    const slotHour = parseInt(option.value.split(':')[0]);
                    if (slotHour <= currentHour) {
                        option.disabled = true;
                        option.style.color = '#ccc';
                    } else {
                        option.disabled = false;
                        option.style.color = '';
                        option.textContent = option.textContent.replace(' (Unavailable)', '');
                    }
                } else {
                    option.disabled = false;
                    option.style.color = '';
                    option.textContent = option.textContent.replace(' (Unavailable)', '');
                }
            }
        }
    });
}

// Initialize booked slots on page load
loadBookedCuppingSlots();

// Cache DOM elements for better performance
const dateInput = document.getElementById('date');
const timeSlotGroup = document.getElementById('timeSlotGroup');
const timeSlotSelect = document.getElementById('timeSlot');
const selectedCountElement = document.getElementById('selectedCount');
const estimatedTotalElement = document.getElementById('estimatedTotal');

if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // Show time slots when date is selected
    dateInput.addEventListener('change', async function() {
        // Clear any existing date error when date is selected
        const dateError = document.getElementById('dateError');
        if (dateError && this.value) {
            dateError.textContent = '';
            dateError.classList.remove('show');
        }

        if (this.value) {
            timeSlotGroup.style.display = 'block';
            timeSlotSelect.required = true;

            // Reset all options first
            const options = timeSlotSelect.querySelectorAll('option');
            options.forEach(option => {
                if (option.value) {
                    option.disabled = false;
                    option.style.color = '';
                    option.textContent = option.textContent.replace(' (Unavailable)', '');
                }
            });

            // Apply time restrictions for today
            const selectedDate = new Date(this.value);
            const today = new Date();
            const isToday = selectedDate.toDateString() === today.toDateString();

            if (isToday) {
                const currentHour = today.getHours();
                options.forEach(option => {
                    if (option.value) {
                        const slotHour = parseInt(option.value.split(':')[0]);
                        if (slotHour <= currentHour) {
                            option.disabled = true;
                            option.style.color = '#ccc';
                            option.textContent = option.textContent.replace(' (Past time)', '') + ' (Past time)';
                        }
                    }
                });
            }

            // Update time slot availability including cupping bookings and GitHub data
            await updateTimeSlotWithGitHubData(this.value);
        } else {
            timeSlotGroup.style.display = 'none';
            timeSlotSelect.required = false;
            timeSlotSelect.value = '';
        }
    });

    // Clear time slot error when time is selected
    timeSlotSelect.addEventListener('change', function() {
        if (this.value) {
            const timeSlotError = document.getElementById('timeSlotError');
            if (timeSlotError) {
                timeSlotError.textContent = '';
                timeSlotError.classList.remove('show');
            }
        }
    });
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

        // Clear any existing error messages
        clearErrorMessages();

        // Validate all required fields
        let hasErrors = false;

        // Validate name
        const name = formData.get('fullName');
        if (!name || !name.trim()) {
            showFieldError('nameError', 'Please enter your full name.');
            hasErrors = true;
        }

        // Validate email
        const email = formData.get('email');
        if (!email || !email.trim()) {
            showFieldError('emailError', 'Please enter your email address.');
            hasErrors = true;
        } else {
            // Enhanced email validation
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            const trimmedEmail = email.trim();

            if (!emailRegex.test(trimmedEmail)) {
                showFieldError('emailError', 'Please enter a valid email address (e.g., example@email.com).');
                hasErrors = true;
            } else if (trimmedEmail.length > 254) {
                showFieldError('emailError', 'Email address is too long.');
                hasErrors = true;
            } else if (trimmedEmail.includes('..')) {
                showFieldError('emailError', 'Email address cannot contain consecutive dots.');
                hasErrors = true;
            }
        }

        // Validate phone (UK numbers only)
        const phone = formData.get('phone');
        if (!phone || !phone.trim()) {
            showFieldError('phoneError', 'Please enter your phone number.');
            hasErrors = true;
        } else {
            const trimmedPhone = phone.trim();
            // Remove all non-digit characters for validation
            const digitsOnly = trimmedPhone.replace(/\D/g, '');

            // UK phone number validation
            const ukPhoneRegex = /^(\+44\s?|0)([1-9]\d{8,9})$/;
            const ukMobileRegex = /^(\+44\s?7|07)([0-9]{9})$/;
            const ukLandlineRegex = /^(\+44\s?[1-2]|0[1-2])([0-9]{8,9})$/;

            // Check if phone contains only valid characters
            const allowedCharsRegex = /^[\d\s\-\+\(\)\.]+$/;
            if (!allowedCharsRegex.test(trimmedPhone)) {
                showFieldError('phoneError', 'Phone number can only contain numbers, spaces, hyphens, plus signs, dots, and brackets.');
                hasErrors = true;
            } else if (!ukPhoneRegex.test(digitsOnly) && !ukMobileRegex.test(digitsOnly) && !ukLandlineRegex.test(digitsOnly)) {
                showFieldError('phoneError', 'Please enter a valid UK phone number (e.g., 07123456789, +44 7123 456789, 01234 567890).');
                hasErrors = true;
            } else if (digitsOnly.length < 10 || digitsOnly.length > 11) {
                showFieldError('phoneError', 'UK phone numbers must be 10-11 digits long.');
                hasErrors = true;
            }
        }

        // Validate services selection
        if (selectedServices.length === 0) {
            showFieldError('servicesError', 'Please select at least one service.');
            hasErrors = true;
        } else if (selectedServices.length > 10) {
            showFieldError('servicesError', 'Please select no more than 10 services.');
            hasErrors = true;
        }

        // Validate date
        const date = formData.get('preferredDate');
        if (!date || !date.trim()) {
            showFieldError('dateError', 'Please select your preferred date.');
            hasErrors = true;
        }

        // Validate time slot (only if date is selected)
        const timeSlot = formData.get('preferredTime');
        if (date && date.trim() && (!timeSlot || !timeSlot.trim())) {
            showFieldError('timeSlotError', 'Please select your preferred time.');
            hasErrors = true;
        }

        // If there are errors, stop submission
        if (hasErrors) {
            submitBtn.classList.remove('btn-loading');
            submitBtn.disabled = false;
            return;
        }

        const bookingData = {
            fullName: formData.get('fullName') || formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            services: selectedServices,
            preferredDate: formData.get('preferredDate') || formData.get('date'),
            preferredTime: formData.get('preferredTime') || formData.get('timeSlot'),
            additionalNotes: formData.get('additionalNotes') || formData.get('message') || 'No additional notes',
            submittedAt: new Date().toISOString()
        };

        try {
            // Submit to N8N webhook
            const response = await fetch('https://ya51ne.app.n8n.cloud/webhook/booking-webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                // Check if cupping services were booked and mark time slot as unavailable
                const selectedServices = formData.getAll('services');
                const preferredDate = formData.get('preferredDate');
                const preferredTime = formData.get('preferredTime');

                if (hasCuppingServices(selectedServices) && preferredDate && preferredTime) {
                    markCuppingSlotAsBooked(preferredDate, preferredTime);
                }

                // Show success message
                const successMessage = createMessage('success',
                    'Thank you for your booking request! Our team at R&R will contact you within 24 hours to confirm your appointment. We look forward to helping you rejuvenate and revitalise!');
                this.insertBefore(successMessage, this.firstChild);

                // Reset form
                this.reset();

                // Reset services selection visual state
                const serviceCheckboxes = document.querySelectorAll('input[name="services"]');
                serviceCheckboxes.forEach(checkbox => {
                    const parentLabel = checkbox.closest('.service-checkbox');
                    parentLabel.classList.remove('selected');
                    checkbox.disabled = false;
                    checkbox.parentElement.style.opacity = '1';
                });

                // Reset services selection display
                const selectedCountElement = document.getElementById('selectedCount');
                const estimatedTotalElement = document.getElementById('estimatedTotal');
                if (selectedCountElement) selectedCountElement.textContent = '0';
                if (estimatedTotalElement) estimatedTotalElement.textContent = '';

                // Hide time slot group and reset time slot
                const timeSlotGroup = document.getElementById('timeSlotGroup');
                const timeSlotSelect = document.getElementById('timeSlot');
                if (timeSlotGroup) timeSlotGroup.style.display = 'none';
                if (timeSlotSelect) {
                    timeSlotSelect.required = false;
                    timeSlotSelect.value = '';
                    // Re-enable all time slot options
                    const options = timeSlotSelect.querySelectorAll('option');
                    options.forEach(option => {
                        option.disabled = false;
                        option.style.color = '';
                    });
                }

                // Reset character counter
                const characterCountElement = document.getElementById('characterCount');
                const characterCounterElement = document.querySelector('.character-counter');
                if (characterCountElement) characterCountElement.textContent = '0';
                if (characterCounterElement) characterCounterElement.classList.remove('warning');

                // Clear any lingering error messages
                clearErrorMessages();

                // Scroll to top of form to show message
                this.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                throw new Error('Network response was not ok');
            }

        } catch (error) {
            console.error('Booking submission error:', error);
            // Show error message
            const errorMessage = createMessage('error',
                'Sorry, there was an error submitting your booking. Please try again or contact us directly at rejuvenate.revitalise@gmail.com.');
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
Hello R&R Team,

I would like to book an appointment for the following:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Services: ${servicesText}
Preferred Date: ${data.date}
Preferred Time: ${data.timeSlot}
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

// Character counter for additional notes
const messageTextarea = document.getElementById('message');
const characterCountElement = document.getElementById('characterCount');
const characterCounterElement = document.querySelector('.character-counter');

if (messageTextarea && characterCountElement) {
    messageTextarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        const maxLength = 250;

        // Update character count
        characterCountElement.textContent = currentLength;

        // Change color when approaching limit (80% or more)
        if (currentLength >= maxLength * 0.8) {
            characterCounterElement.classList.add('warning');
        } else {
            characterCounterElement.classList.remove('warning');
        }

        // Prevent typing beyond limit (backup to maxlength attribute)
        if (currentLength >= maxLength) {
            this.value = this.value.substring(0, maxLength);
            characterCountElement.textContent = maxLength;
        }
    });
}

// Helper function to create success/error messages
function createMessage(type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-${type}`;
    messageDiv.textContent = text;
    return messageDiv;
}

// Consolidated error message handling
const ErrorHandler = {
    show: function(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    },
    clear: function() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => {
            error.textContent = '';
            error.classList.remove('show');
        });
    }
};

// Legacy function wrappers for backward compatibility
function showFieldError(elementId, message) {
    ErrorHandler.show(elementId, message);
}

function clearErrorMessages() {
    ErrorHandler.clear();
}

// Multiple services selection handling - use cached elements
const serviceCheckboxes = document.querySelectorAll('input[name="services"]');

if (serviceCheckboxes.length > 0) {
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleServiceSelection);
    });
}

function handleServiceSelection() {
    const checkedBoxes = document.querySelectorAll('input[name="services"]:checked');
    const count = checkedBoxes.length;

    // Update visual feedback for selected services
    serviceCheckboxes.forEach(checkbox => {
        const parentLabel = checkbox.closest('.service-checkbox');
        if (checkbox.checked) {
            parentLabel.classList.add('selected');
        } else {
            parentLabel.classList.remove('selected');
        }
    });

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

    // Update time slot availability if date is selected and cupping services are involved
    const dateValue = dateInput ? dateInput.value : null;
    if (dateValue && timeSlotSelect) {
        const selectedServices = Array.from(checkedBoxes).map(cb => cb.value);
        updateTimeSlotWithGitHubData(dateValue);
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

    // Enhanced email validation
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const trimmedEmail = emailField.value.trim();
        if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 254 || trimmedEmail.includes('..')) {
            emailField.classList.add('error');
            isValid = false;
        }
    }

    // Enhanced phone validation (UK numbers only)
    const phoneField = form.querySelector('input[type="tel"]');
    if (phoneField && phoneField.value) {
        const trimmedPhone = phoneField.value.trim();
        const digitsOnly = trimmedPhone.replace(/\D/g, '');
        const allowedCharsRegex = /^[\d\s\-\+\(\)\.]+$/;
        const ukPhoneRegex = /^(\+44\s?|0)([1-9]\d{8,9})$/;
        const ukMobileRegex = /^(\+44\s?7|07)([0-9]{9})$/;
        const ukLandlineRegex = /^(\+44\s?[1-2]|0[1-2])([0-9]{8,9})$/;

        if (!allowedCharsRegex.test(trimmedPhone) ||
            (!ukPhoneRegex.test(digitsOnly) && !ukMobileRegex.test(digitsOnly) && !ukLandlineRegex.test(digitsOnly)) ||
            digitsOnly.length < 10 || digitsOnly.length > 11) {
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
        // Calculate max-height based on screen size for better mobile support
        const isMobile = window.innerWidth <= 768;
        const extraSpace = isMobile ? 80 : 50;
        content.style.maxHeight = content.scrollHeight + extraSpace + 'px';
    }
}

// Function to load blocked times from GitHub - optimized with caching
let cachedBlockedTimes = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

async function loadBlockedTimesFromGitHub() {
    // Return cached data if still valid
    if (cachedBlockedTimes && (Date.now() - lastFetchTime) < CACHE_DURATION) {
        return cachedBlockedTimes;
    }

    const branches = ['main', 'master'];
    const timestamp = Date.now();
    
    for (const branch of branches) {
        try {
            const url = `https://raw.githubusercontent.com/ya51ne/RandR-Booking-Appointment-Site/${branch}/available-times.json?t=${timestamp}`;
            
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const responseText = await response.text();
                console.log("Raw response from GitHub:", responseText);
                
                try {
                    // Clean up the response text and handle different GitHub API response formats
                    let cleanedText = responseText.trim();
                    
                    // Remove trailing newlines
                    cleanedText = cleanedText.replace(/\n$/, '');
                    
                    // Handle case where entire response is wrapped in quotes
                    if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
                        cleanedText = cleanedText.slice(1, -1);
                        console.log("Removed outer quotes:", cleanedText);
                    }
                    
                    // Handle escaped JSON strings from GitHub API
                    if (cleanedText.includes('\\"')) {
                        // Replace escaped quotes
                        cleanedText = cleanedText.replace(/\\"/g, '"');
                        console.log("Cleaned escaped quotes:", cleanedText);
                    }
                    
                    // Handle escaped backslashes
                    if (cleanedText.includes('\\\\')) {
                        cleanedText = cleanedText.replace(/\\\\/g, '\\');
                        console.log("Cleaned escaped backslashes:", cleanedText);
                    }
                    
                    // Remove any trailing newlines or whitespace that could break JSON parsing
                    cleanedText = cleanedText.replace(/\s+$/, '');
                    
                    // Handle the specific case where there's a trailing \n character
                    if (cleanedText.endsWith('\\n')) {
                        cleanedText = cleanedText.slice(0, -2);
                        console.log("Removed trailing \\n:", cleanedText);
                    }
                    
                    console.log("Final cleaned text for parsing:", cleanedText);
                    
                    const blockedTimes = JSON.parse(cleanedText);
                    
                    if (Array.isArray(blockedTimes)) {
                        console.log("Successfully loaded blocked times from GitHub:", blockedTimes);
                        // Cache successful result
                        cachedBlockedTimes = blockedTimes;
                        lastFetchTime = Date.now();
                        return blockedTimes;
                    } else {
                        console.warn("GitHub response is not an array:", blockedTimes);
                        return [];
                    }
                } catch (parseError) {
                    console.warn("Failed to parse GitHub response as JSON:", parseError);
                    console.warn("Response text was:", responseText);
                    
                    // Try multiple alternative parsing approaches
                    const alternatives = [
                        // Try removing all escape characters
                        responseText.replace(/\\/g, ''),
                        // Try double parsing (in case it's double-encoded)
                        responseText.replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
                        // Try treating as string and parsing inner content
                        responseText.replace(/^"/, '').replace(/"$/, '').replace(/\\"/g, '"')
                    ];
                    
                    for (let i = 0; i < alternatives.length; i++) {
                        try {
                            const result = JSON.parse(alternatives[i].trim());
                            if (Array.isArray(result)) {
                                console.log(`Successfully parsed with alternative method ${i + 1}:`, result);
                                return result;
                            }
                        } catch (altError) {
                            console.warn(`Alternative parsing method ${i + 1} failed:`, altError);
                        }
                    }
                    
                    return [];
                }
            } else {
                console.warn(`Branch '${branch}' not found or file missing (${response.status})`);
            }
        } catch (error) {
            console.warn(`Error trying branch '${branch}':`, error.message);
        }
    }
    
    console.log("Could not load blocked times from GitHub, trying local fallback");
    
    // Fallback to local file
    try {
        const localResponse = await fetch(`./available-times.json?t=${timestamp}`);
        if (localResponse.ok) {
            const blockedTimes = await localResponse.json();
            console.log("Loaded blocked times from local file:", blockedTimes);
            return Array.isArray(blockedTimes) ? blockedTimes : [];
        }
    } catch (localError) {
        console.warn("Local fallback also failed:", localError.message);
    }
    
    return [];
}

// Function to update time slots with GitHub blocked times data
async function updateTimeSlotWithGitHubData(selectedDate) {
    const timeSlotSelectElement = document.getElementById('timeSlot');
    if (!timeSlotSelectElement) {
        console.warn('Preferred Time select element not found');
        return;
    }

    console.log('Updating time slots for date:', selectedDate);

    const options = timeSlotSelectElement.querySelectorAll('option');

    // First reset all options to clean state
    options.forEach(option => {
        if (option.value) {
            option.disabled = false;
            option.style.color = '';
            // Clean up text by removing all status indicators
            const originalText = option.textContent.replace(/ \(Unavailable\)/g, '').replace(/ \(Past time\)/g, '');
            option.textContent = originalText;
        }
    });

    // Apply time restrictions for today (past times)
    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    const isToday = selectedDateObj.toDateString() === today.toDateString();

    if (isToday) {
        const currentHour = today.getHours();
        options.forEach(option => {
            if (option.value) {
                const slotHour = parseInt(option.value.split(':')[0]);
                if (slotHour <= currentHour) {
                    option.disabled = true;
                    option.style.color = '#ccc';
                    option.textContent += ' (Past time)';
                }
            }
        });
    }

    // Apply local cupping bookings
    updateTimeSlotAvailability(selectedDate);

    // Load and apply GitHub blocked times data
    const blockedTimes = await loadBlockedTimesFromGitHub();
    console.log('Processing blocked times:', blockedTimes);

    if (blockedTimes && Array.isArray(blockedTimes) && blockedTimes.length > 0) {
        options.forEach(option => {
            if (option.value && !option.disabled) {
                const timeValue = option.value;
                // Check if this date-time combination is blocked
                const dateTimeString = `${selectedDate} ${timeValue}`;
                const isBlockedOnGitHub = blockedTimes.includes(dateTimeString);

                console.log(`Checking ${dateTimeString}: blocked = ${isBlockedOnGitHub}`);

                if (isBlockedOnGitHub) {
                    option.disabled = true;
                    option.style.color = '#ccc';
                    // Only add (Unavailable) if it's not already there and it's not marked as past time
                    if (!option.textContent.includes('(Unavailable)') && !option.textContent.includes('(Past time)')) {
                        option.textContent += ' (Unavailable)';
                    }
                    console.log(`Disabled time slot: ${timeValue} for ${selectedDate} (blocked on GitHub)`);
                }
            }
        });
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

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Animate page elements
    const animateElements = document.querySelectorAll('.service-category, .feature, .contact-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Initialize GitHub blocked times functionality
    initializeBlockedTimesSystem();
});

// Function to initialize the blocked times system
function initializeBlockedTimesSystem() {
    const dateInputElement = document.getElementById('date');
    const timeSlotElement = document.getElementById('timeSlot');
    
    if (!dateInputElement) {
        console.warn('Preferred Date input element not found');
        return;
    }
    
    if (!timeSlotElement) {
        console.warn('Preferred Time select element not found');
        return;
    }

    console.log('Blocked times system initialized successfully');

    // Load blocked times immediately when date changes
    dateInputElement.addEventListener('change', async (event) => {
        const selectedDate = event.target.value;
        if (selectedDate) {
            console.log('Date changed to:', selectedDate);
            await updateTimeSlotWithGitHubData(selectedDate);
        }
    });
}