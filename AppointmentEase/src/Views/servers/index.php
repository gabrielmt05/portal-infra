<?php include VIEW_PATH . '/templates/header.php'; ?>
<?php include VIEW_PATH . '/templates/sidebar.php'; ?>

<main class="content">
    <div class="container-fluid p-0">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="h3">
                <i class="fas fa-server me-2"></i>
                Server Management
            </h1>
            <?php if ($_SESSION['is_admin']): ?>
            <a href="/servers/create" class="btn btn-primary">
                <i class="fas fa-plus me-1"></i>
                Add Server
            </a>
            <?php endif; ?>
        </div>
        
        <?php if (isset($_SESSION['success'])): ?>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <?= htmlspecialchars($_SESSION['success']) ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
            <?php unset($_SESSION['success']); ?>
        <?php endif; ?>
        
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
                <?php if (empty($servers)): ?>
                    <div class="text-center py-5">
                        <i class="fas fa-server text-muted mb-3" style="font-size: 3rem;"></i>
                        <h4 class="text-muted">No servers found</h4>
                        <?php if ($_SESSION['is_admin']): ?>
                        <p>Click "Add Server" to register your first server.</p>
                        <?php else: ?>
                        <p>Contact an administrator to add servers to the portal.</p>
                        <?php endif; ?>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Hostname</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Last Accessed</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($servers as $server): ?>
                                    <tr>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <div class="status-indicator <?= $server['status'] === 'online' ? 'bg-success' : 'bg-danger' ?>"></div>
                                                <span class="ms-2"><?= htmlspecialchars($server['name']) ?></span>
                                            </div>
                                        </td>
                                        <td><?= htmlspecialchars($server['hostname']) ?>:<?= htmlspecialchars($server['port'] ?? '9090') ?></td>
                                        <td><?= htmlspecialchars($server['description'] ?? 'N/A') ?></td>
                                        <td>
                                            <?php if ($server['status'] === 'online'): ?>
                                                <span class="badge bg-success">Online</span>
                                            <?php elseif ($server['status'] === 'offline'): ?>
                                                <span class="badge bg-danger">Offline</span>
                                            <?php else: ?>
                                                <span class="badge bg-warning">Unknown</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if (!empty($server['last_accessed'])): ?>
                                                <?= date('M d, Y H:i', strtotime($server['last_accessed'])) ?>
                                            <?php else: ?>
                                                <span class="text-muted">Never</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <div class="d-flex gap-2">
                                                <a href="/servers/access/<?= $server['id'] ?>" 
                                                   class="btn btn-sm btn-primary" 
                                                   <?= $server['status'] === 'online' ? '' : 'disabled' ?> 
                                                   title="<?= $server['status'] === 'online' ? 'Connect to Cockpit' : 'Server offline' ?>">
                                                    <i class="fas fa-sign-in-alt"></i>
                                                </a>
                                                
                                                <?php if ($_SESSION['is_admin']): ?>
                                                <a href="/servers/edit/<?= $server['id'] ?>" class="btn btn-sm btn-outline-primary">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                                
                                                <a href="#" class="btn btn-sm btn-outline-danger" 
                                                   data-bs-toggle="modal" 
                                                   data-bs-target="#deleteServerModal" 
                                                   data-server-id="<?= $server['id'] ?>"
                                                   data-server-name="<?= htmlspecialchars($server['name']) ?>">
                                                    <i class="fas fa-trash"></i>
                                                </a>
                                                <?php endif; ?>
                                            </div>
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
</main>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteServerModal" tabindex="-1" aria-labelledby="deleteServerModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="deleteServerModalLabel">Confirm Deletion</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                Are you sure you want to delete server <strong id="deleteServerName"></strong>? This action cannot be undone.
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <a href="#" id="confirmDeleteServer" class="btn btn-danger">Delete</a>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        const deleteModal = document.getElementById('deleteServerModal');
        if (deleteModal) {
            deleteModal.addEventListener('show.bs.modal', function (event) {
                const button = event.relatedTarget;
                const serverId = button.getAttribute('data-server-id');
                const serverName = button.getAttribute('data-server-name');
                
                document.getElementById('deleteServerName').textContent = serverName;
                document.getElementById('confirmDeleteServer').href = '/servers/delete/' + serverId;
            });
        }
    });
</script>

<?php include VIEW_PATH . '/templates/footer.php'; ?>
