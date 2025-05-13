<?php include VIEW_PATH . '/templates/header.php'; ?>
<?php include VIEW_PATH . '/templates/sidebar.php'; ?>

<main class="content">
    <div class="container-fluid p-0">
        <div class="row mb-4">
            <div class="col-12">
                <h1 class="h3 mb-3">
                    <i class="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                </h1>
                <p class="text-muted">Welcome to the Cockpit Portal dashboard, <?= htmlspecialchars(Session::get('full_name')) ?>.</p>
            </div>
        </div>

        <!-- Server overview cards -->
        <div class="row">
            <!-- Total servers card -->
            <div class="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <div class="square-icon bg-primary bg-opacity-10 text-primary">
                                    <i class="fas fa-server"></i>
                                </div>
                                <div class="ms-3">
                                    <h5 class="mb-0">Total Servers</h5>
                                </div>
                            </div>
                        </div>
                        <h1 class="mt-1 mb-3 display-5"><?= $totalServers ?></h1>
                        <div class="mb-0">
                            <span class="text-muted">Registered servers</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Online servers card -->
            <div class="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <div class="square-icon bg-success bg-opacity-10 text-success">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <div class="ms-3">
                                    <h5 class="mb-0">Online</h5>
                                </div>
                            </div>
                        </div>
                        <h1 class="mt-1 mb-3 display-5"><?= $serverStatuses['online'] ?></h1>
                        <div class="mb-0">
                            <span class="text-success">
                                <i class="fas fa-arrow-up me-1"></i>
                                <?= $totalServers > 0 ? round(($serverStatuses['online'] / $totalServers) * 100) : 0 ?>%
                            </span>
                            <span class="text-muted">of servers</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Offline servers card -->
            <div class="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <div class="square-icon bg-danger bg-opacity-10 text-danger">
                                    <i class="fas fa-times-circle"></i>
                                </div>
                                <div class="ms-3">
                                    <h5 class="mb-0">Offline</h5>
                                </div>
                            </div>
                        </div>
                        <h1 class="mt-1 mb-3 display-5"><?= $serverStatuses['offline'] ?></h1>
                        <div class="mb-0">
                            <span class="text-danger">
                                <i class="fas fa-arrow-down me-1"></i>
                                <?= $totalServers > 0 ? round(($serverStatuses['offline'] / $totalServers) * 100) : 0 ?>%
                            </span>
                            <span class="text-muted">of servers</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Unknown status card -->
            <div class="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <div class="d-flex align-items-center">
                                <div class="square-icon bg-warning bg-opacity-10 text-warning">
                                    <i class="fas fa-question-circle"></i>
                                </div>
                                <div class="ms-3">
                                    <h5 class="mb-0">Unknown</h5>
                                </div>
                            </div>
                        </div>
                        <h1 class="mt-1 mb-3 display-5"><?= $serverStatuses['unknown'] ?></h1>
                        <div class="mb-0">
                            <span class="text-warning">
                                <i class="fas fa-exclamation-triangle me-1"></i>
                                <?= $totalServers > 0 ? round(($serverStatuses['unknown'] / $totalServers) * 100) : 0 ?>%
                            </span>
                            <span class="text-muted">of servers</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <!-- Recently accessed servers -->
            <div class="col-lg-6 col-md-12 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-transparent border-0">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-history me-2"></i>
                            Recently Accessed Servers
                        </h5>
                    </div>
                    <div class="card-body">
                        <?php if (empty($recentServers)): ?>
                            <div class="text-center py-4">
                                <i class="fas fa-info-circle text-muted mb-2" style="font-size: 2rem;"></i>
                                <p class="text-muted">No servers have been accessed recently.</p>
                            </div>
                        <?php else: ?>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Server</th>
                                            <th>Host</th>
                                            <th>Last Accessed</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recentServers as $server): ?>
                                            <tr>
                                                <td>
                                                    <div class="d-flex align-items-center">
                                                        <div class="status-indicator <?= $this->checkServerStatus($server) === 'online' ? 'bg-success' : 'bg-danger' ?>"></div>
                                                        <?= htmlspecialchars($server['name']) ?>
                                                    </div>
                                                </td>
                                                <td><?= htmlspecialchars($server['hostname']) ?></td>
                                                <td><?= date('M d, H:i', strtotime($server['last_accessed'])) ?></td>
                                                <td>
                                                    <a href="/servers/access/<?= $server['id'] ?>" class="btn btn-sm btn-primary">
                                                        <i class="fas fa-sign-in-alt"></i>
                                                    </a>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Quick access -->
            <div class="col-lg-6 col-md-12 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-transparent border-0">
                        <h5 class="card-title mb-0">
                            <i class="fas fa-bolt me-2"></i>
                            Quick Access
                        </h5>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <div class="mb-4">
                            <p class="text-muted">Access commonly used server management features:</p>
                        </div>
                        
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <a href="/servers" class="quick-action-card d-flex align-items-center p-3 rounded bg-light text-decoration-none">
                                    <div class="feature-icon d-inline-flex align-items-center justify-content-center text-primary bg-primary bg-opacity-10 me-3">
                                        <i class="fas fa-server"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-1">Server List</h6>
                                        <p class="card-text mb-0 small text-muted">View all servers</p>
                                    </div>
                                </a>
                            </div>
                            
                            <?php if ($isAdmin): ?>
                            <div class="col-md-6">
                                <a href="/servers/create" class="quick-action-card d-flex align-items-center p-3 rounded bg-light text-decoration-none">
                                    <div class="feature-icon d-inline-flex align-items-center justify-content-center text-success bg-success bg-opacity-10 me-3">
                                        <i class="fas fa-plus-circle"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-1">Add Server</h6>
                                        <p class="card-text mb-0 small text-muted">Register new server</p>
                                    </div>
                                </a>
                            </div>
                            
                            <div class="col-md-6">
                                <a href="/users" class="quick-action-card d-flex align-items-center p-3 rounded bg-light text-decoration-none">
                                    <div class="feature-icon d-inline-flex align-items-center justify-content-center text-info bg-info bg-opacity-10 me-3">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-1">User Management</h6>
                                        <p class="card-text mb-0 small text-muted">Manage portal users</p>
                                    </div>
                                </a>
                            </div>
                            <?php endif; ?>
                            
                            <div class="col-md-6">
                                <a href="/logout" class="quick-action-card d-flex align-items-center p-3 rounded bg-light text-decoration-none">
                                    <div class="feature-icon d-inline-flex align-items-center justify-content-center text-danger bg-danger bg-opacity-10 me-3">
                                        <i class="fas fa-sign-out-alt"></i>
                                    </div>
                                    <div>
                                        <h6 class="mb-1">Logout</h6>
                                        <p class="card-text mb-0 small text-muted">End current session</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</main>

<?php include VIEW_PATH . '/templates/footer.php'; ?>
