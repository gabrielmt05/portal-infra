/**
 * Cockpit Portal - Main JavaScript functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Sidebar toggle functionality
    const sidebarToggle = document.querySelector('.js-sidebar-toggle');
    const sidebar = document.querySelector('.js-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Adjust content width based on sidebar state
            const content = document.querySelector('.content');
            const navbar = document.querySelector('.navbar');
            
            if (content && navbar) {
                if (sidebar.classList.contains('collapsed')) {
                    content.style.marginLeft = 'var(--sidebar-collapsed-width)';
                    navbar.style.left = 'var(--sidebar-collapsed-width)';
                } else {
                    content.style.marginLeft = 'var(--sidebar-width)';
                    navbar.style.left = 'var(--sidebar-width)';
                }
            }
        });
    }
    
    // Mobile sidebar toggle
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    function handleScreenChange(e) {
        if (e.matches && sidebar) {
            sidebar.classList.add('collapsed');
            
            // Handle touch events for mobile - sidebar open on swipe right
            let touchStartX = 0;
            let touchEndX = 0;
            
            document.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            }, false);
            
            document.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, false);
            
            function handleSwipe() {
                if (touchEndX - touchStartX > 100 && touchStartX < 50) {
                    // Right swipe near left edge
                    sidebar.classList.remove('collapsed');
                    sidebar.classList.add('show');
                } else if (touchStartX - touchEndX > 100) {
                    // Left swipe
                    sidebar.classList.add('collapsed');
                    sidebar.classList.remove('show');
                }
            }
        }
    }
    
    mediaQuery.addEventListener('change', handleScreenChange);
    handleScreenChange(mediaQuery);
    
    // Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
    
    // Password validation - Show password toggle
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(function(field) {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'btn btn-outline-secondary password-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.title = 'Show/Hide Password';
        
        // Place toggle button after password field
        field.parentNode.classList.add('input-group');
        field.insertAdjacentElement('afterend', toggleBtn);
        
        // Add event listener
        toggleBtn.addEventListener('click', function() {
            if (field.type === 'password') {
                field.type = 'text';
                toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                field.type = 'password';
                toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
    
    // Server status polling
    function updateServerStatus() {
        const statusIndicators = document.querySelectorAll('.status-indicator');
        
        if (statusIndicators.length > 0) {
            // We'll use a simple approach for now
            // In a real implementation, you'd make an AJAX request to get current status
            
            // For demonstration, we'll just refresh the page every 2 minutes
            // This is a simple solution, but in production you'd use AJAX
            setTimeout(function() {
                if (window.location.pathname.includes('/servers') || 
                    window.location.pathname.includes('/dashboard')) {
                    window.location.reload();
                }
            }, 120000); // 2 minutes
        }
    }
    
    updateServerStatus();
    
    // Confirmation modals for dangerous actions
    const confirmationModals = document.querySelectorAll('[data-bs-toggle="modal"]');
    
    confirmationModals.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const target = document.querySelector(btn.getAttribute('data-bs-target'));
            
            if (target) {
                const confirmBtn = target.querySelector('.btn-danger');
                if (confirmBtn) {
                    confirmBtn.focus();
                }
            }
        });
    });
    
    // Tooltips initialization
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (tooltipTriggerList.length > 0) {
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
    
    // Server connection attempts tracking
    const accessButtons = document.querySelectorAll('a[href^="/servers/access/"]');
    
    accessButtons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            // Mark button as loading when clicked
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
            btn.classList.add('disabled');
            
            // In a real implementation, you might want to handle failures
            // by adding an event listener to detect navigation errors
            setTimeout(function() {
                // If we're still on the same page after 5 seconds, something went wrong
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i>';
                btn.classList.remove('disabled');
                
                // Show error message if needed
                // This is simplified - in a real app, you'd implement proper error handling
            }, 5000);
        });
    });
});
