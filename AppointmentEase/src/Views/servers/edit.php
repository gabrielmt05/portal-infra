<?php include VIEW_PATH . '/templates/header.php'; ?>
<?php include VIEW_PATH . '/templates/sidebar.php'; ?>

<main class="content">
    <div class="container-fluid p-0">
        <div class="mb-4">
            <h1 class="h3">
                <i class="fas fa-edit me-2"></i>
                Edit Server
            </h1>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="/dashboard">Dashboard</a></li>
                    <li class="breadcrumb-item"><a href="/servers">Servers</a></li>
                    <li class="breadcrumb-item active">Edit Server</li>
                </ol>
            </nav>
        </div>
        
        <?php if (isset($_SESSION['errors']) && !empty($_SESSION['errors'])): ?>
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <ul class="mb-0">
                    <?php foreach ($_SESSION['errors'] as $error): ?>
                        <li><?= htmlspecialchars($error) ?></li>
                    <?php endforeach; ?>
                </ul>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
            <?php unset($_SESSION['errors']); ?>
        <?php endif; ?>
        
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <form action="/servers/update/<?= $server['id'] ?>" method="post" class="needs-validation" novalidate>
                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="name" class="form-label">Server Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="name" name="name" 
                                       value="<?= htmlspecialchars($_SESSION['old']['name'] ?? $server['name']) ?>" 
                                       required>
                                <div class="form-text">A descriptive name for this server.</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="hostname" class="form-label">Hostname/IP <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="hostname" name="hostname" 
                                       value="<?= htmlspecialchars($_SESSION['old']['hostname'] ?? $server['hostname']) ?>" 
                                       required>
                                <div class="form-text">The hostname or IP address of the server.</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="port" class="form-label">Port</label>
                                <input type="number" class="form-control" id="port" name="port" 
                                       value="<?= htmlspecialchars($_SESSION['old']['port'] ?? $server['port'] ?? 9090) ?>" 
                                       min="1" max="65535">
                                <div class="form-text">Default Cockpit port is 9090.</div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="description" class="form-label">Description</label>
                                <textarea class="form-control" id="description" name="description" rows="2"><?= htmlspecialchars($_SESSION['old']['description'] ?? $server['description'] ?? '') ?></textarea>
                                <div class="form-text">Optional. Add information about this server's purpose.</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="username" class="form-label">Cockpit Username <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="username" name="username" 
                                       value="<?= htmlspecialchars($_SESSION['old']['username'] ?? $server['username']) ?>" 
                                       required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label">Cockpit Password</label>
                                <input type="password" class="form-control" id="password" name="password">
                                <div class="form-text">Leave blank to keep the current password. New password will be encrypted.</div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="use_ssl" name="use_ssl"
                                           <?= (isset($_SESSION['old']['use_ssl']) && $_SESSION['old']['use_ssl']) || 
                                               (!isset($_SESSION['old']) && !empty($server['use_ssl'])) ? 'checked' : '' ?>>
                                    <label class="form-check-label" for="use_ssl">Use HTTPS</label>
                                </div>
                                <div class="form-text">Enable if Cockpit uses HTTPS.</div>
                            </div>
                        </div>
                    </div>
                    
                    <hr class="my-4">
                    
                    <div class="d-flex justify-content-between">
                        <a href="/servers" class="btn btn-secondary">
                            <i class="fas fa-arrow-left me-1"></i>
                            Back
                        </a>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save me-1"></i>
                            Update Server
                        </button>
                    </div>
                </form>
                
                <?php unset($_SESSION['old']); ?>
            </div>
        </div>
    </div>
</main>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Bootstrap form validation
        const forms = document.querySelectorAll('.needs-validation');
        
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                form.classList.add('was-validated');
            }, false);
        });
    });
</script>

<?php include VIEW_PATH . '/templates/footer.php'; ?>
