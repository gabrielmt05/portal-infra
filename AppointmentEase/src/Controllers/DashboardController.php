<?php
namespace Src\Controllers;

use Src\Models\Server;
use Src\Middleware\AuthMiddleware;
use Src\Utilities\Session;

/**
 * Dashboard Controller
 * 
 * Manages the main dashboard display
 */
class DashboardController
{
    /**
     * Constructor - enforce authentication
     */
    public function __construct()
    {
        AuthMiddleware::authenticate();
    }
    
    /**
     * Show dashboard with server overview
     * 
     * @return void
     */
    public function index()
    {
        // Get server statistics for the dashboard
        $serverModel = new Server();
        $servers = $serverModel->getAll();
        
        // Count accessible servers
        $totalServers = count($servers);
        
        // Server status data
        $serverStatuses = [
            'online' => 0,
            'offline' => 0,
            'unknown' => 0
        ];
        
        // Latest accessed servers
        $recentServers = [];
        
        // Process servers for display
        foreach ($servers as $server) {
            // Check server status by attempting a connection
            $status = $this->checkServerStatus($server);
            $serverStatuses[$status]++;
            
            // Add to recent servers if accessed recently
            if (!empty($server['last_accessed'])) {
                $recentServers[] = $server;
            }
        }
        
        // Sort recent servers by last accessed time (most recent first)
        usort($recentServers, function($a, $b) {
            return strtotime($b['last_accessed']) - strtotime($a['last_accessed']);
        });
        
        // Limit to 5 most recent
        $recentServers = array_slice($recentServers, 0, 5);
        
        // Get current user
        $userId = Session::get('user_id');
        $isAdmin = Session::get('is_admin');
        
        // Include dashboard view
        include VIEW_PATH . '/dashboard/index.php';
    }
    
    /**
     * Check server connection status
     *
     * @param array $server Server data
     * @return string Status: 'online', 'offline', or 'unknown'
     */
    private function checkServerStatus($server)
    {
        // Try to establish a connection to check server availability
        // This is a simplified version - in production, you'd use a more robust method
        $address = $server['hostname'];
        $port = 9090; // Default Cockpit port
        
        // Attempt connection with timeout
        $socket = @fsockopen($address, $port, $errno, $errstr, 1);
        
        if ($socket) {
            fclose($socket);
            return 'online';
        }
        
        return 'offline';
    }
}
