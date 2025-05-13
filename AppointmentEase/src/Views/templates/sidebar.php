<!-- Sidebar -->
<nav id="sidebar" class="sidebar js-sidebar">
    <div class="sidebar-content js-simplebar">
        <a class="sidebar-brand" href="/dashboard">
            <i class="fas fa-server me-2"></i>
            <span class="align-middle">Cockpit Portal</span>
        </a>

        <ul class="sidebar-nav">
            <li class="sidebar-header">
                Navigation
            </li>

            <li class="sidebar-item <?= $_SERVER['REQUEST_URI'] === '/dashboard' ? 'active' : '' ?>">
                <a class="sidebar-link" href="/dashboard">
                    <i class="fas fa-tachometer-alt"></i> <span class="align-middle">Dashboard</span>
                </a>
            </li>
            
            <li class="sidebar-item <?= strpos($_SERVER['REQUEST_URI'], '/servers') === 0 ? 'active' : '' ?>">
                <a class="sidebar-link" href="/servers">
                    <i class="fas fa-server"></i> <span class="align-middle">Servers</span>
                </a>
            </li>
            
            <?php if ($_SESSION['is_admin']): ?>
            <li class="sidebar-header">
                Administration
            </li>
            
            <li class="sidebar-item <?= strpos($_SERVER['REQUEST_URI'], '/users') === 0 ? 'active' : '' ?>">
                <a class="sidebar-link" href="/users">
                    <i class="fas fa-users"></i> <span class="align-middle">User Management</span>
                </a>
            </li>
            <?php endif; ?>
            
            <li class="sidebar-header">
                Account
            </li>
            
            <li class="sidebar-item">
                <a class="sidebar-link" href="/logout">
                    <i class="fas fa-sign-out-alt"></i> <span class="align-middle">Logout</span>
                </a>
            </li>
        </ul>
    </div>
</nav>
