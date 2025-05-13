<?php
namespace Src\Controllers;

use Src\Models\Server;
use Src\Middleware\AuthMiddleware;
use Src\Utilities\Session;
use Src\Utilities\Validator;

/**
 * Server Controller
 * 
 * Manages server CRUD operations and access to Cockpit instances
 */
class ServerController
{
    /**
     * Server model instance
     *
     * @var Server
     */
    private $serverModel;
    
    /**
     * Constructor - enforce authentication
     */
    public function __construct()
    {
        AuthMiddleware::authenticate();
        
        $this->serverModel = new Server();
    }
    
    /**
     * Display list of servers
     * 
     * @return void
     */
    public function index()
    {
        // Get all servers
        $servers = $this->serverModel->getAll();
        
        // Check status for each server
        foreach ($servers as &$server) {
            $server['status'] = $this->checkServerStatus($server);
        }
        
        // Include servers list view
        include VIEW_PATH . '/servers/index.php';
    }
    
    /**
     * Show server creation form
     * 
     * @return void
     */
    public function create()
    {
        // Only admins can create servers
        AuthMiddleware::requireAdmin();
        
        // Include create server view
        include VIEW_PATH . '/servers/create.php';
    }
    
    /**
     * Store a new server
     * 
     * @return void
     */
    public function store()
    {
        // Only admins can create servers
        AuthMiddleware::requireAdmin();
        
        // Validate form input
        $name = $_POST['name'] ?? '';
        $hostname = $_POST['hostname'] ?? '';
        $description = $_POST['description'] ?? '';
        $port = $_POST['port'] ?? 9090;
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        // Validate input
        $validator = new Validator();
        $validator->validate([
            'name' => [$name, 'required|max:100'],
            'hostname' => [$hostname, 'required|max:255'],
            'port' => [$port, 'numeric|min:1|max:65535'],
            'username' => [$username, 'required|max:100'],
            'password' => [$password, 'required'],
        ]);
        
        // Check for validation errors
        if ($validator->hasErrors()) {
            Session::set('errors', $validator->getErrors());
            Session::set('old', $_POST);
            header('Location: /servers/create');
            exit;
        }
        
        // Encrypt sensitive data
        $encryptionKey = getenv('APP_KEY');
        $encryptedPassword = openssl_encrypt(
            $password,
            'AES-256-CBC',
            substr(base64_decode($encryptionKey), 0, 32),
            0,
            str_repeat("\0", 16)
        );
        
        // Create server
        $serverData = [
            'name' => $name,
            'hostname' => $hostname,
            'description' => $description,
            'port' => $port,
            'username' => $username,
            'password' => $encryptedPassword,
            'created_by' => Session::get('user_id')
        ];
        
        $this->serverModel->create($serverData);
        
        // Set success message and redirect
        Session::set('success', 'Server added successfully');
        header('Location: /servers');
        exit;
    }
    
    /**
     * Show server edit form
     * 
     * @param int $id Server ID
     * @return void
     */
    public function edit($id)
    {
        // Only admins can edit servers
        AuthMiddleware::requireAdmin();
        
        // Get server data
        $server = $this->serverModel->getById($id);
        
        if (!$server) {
            Session::set('errors', ['Server not found']);
            header('Location: /servers');
            exit;
        }
        
        // Include edit server view
        include VIEW_PATH . '/servers/edit.php';
    }
    
    /**
     * Update server data
     * 
     * @param int $id Server ID
     * @return void
     */
    public function update($id)
    {
        // Only admins can update servers
        AuthMiddleware::requireAdmin();
        
        // Get server data
        $server = $this->serverModel->getById($id);
        
        if (!$server) {
            Session::set('errors', ['Server not found']);
            header('Location: /servers');
            exit;
        }
        
        // Validate form input
        $name = $_POST['name'] ?? '';
        $hostname = $_POST['hostname'] ?? '';
        $description = $_POST['description'] ?? '';
        $port = $_POST['port'] ?? 9090;
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        
        // Validate input
        $validator = new Validator();
        $validator->validate([
            'name' => [$name, 'required|max:100'],
            'hostname' => [$hostname, 'required|max:255'],
            'port' => [$port, 'numeric|min:1|max:65535'],
            'username' => [$username, 'required|max:100'],
        ]);
        
        // Check for validation errors
        if ($validator->hasErrors()) {
            Session::set('errors', $validator->getErrors());
            Session::set('old', $_POST);
            header("Location: /servers/edit/{$id}");
            exit;
        }
        
        // Prepare server data
        $serverData = [
            'name' => $name,
            'hostname' => $hostname,
            'description' => $description,
            'port' => $port,
            'username' => $username,
            'updated_by' => Session::get('user_id')
        ];
        
        // Update password if provided
        if (!empty($password)) {
            $encryptionKey = getenv('APP_KEY');
            $encryptedPassword = openssl_encrypt(
                $password,
                'AES-256-CBC',
                substr(base64_decode($encryptionKey), 0, 32),
                0,
                str_repeat("\0", 16)
            );
            
            $serverData['password'] = $encryptedPassword;
        }
        
        // Update server
        $this->serverModel->update($id, $serverData);
        
        // Set success message and redirect
        Session::set('success', 'Server updated successfully');
        header('Location: /servers');
        exit;
    }
    
    /**
     * Delete a server
     * 
     * @param int $id Server ID
     * @return void
     */
    public function delete($id)
    {
        // Only admins can delete servers
        AuthMiddleware::requireAdmin();
        
        // Check if server exists
        $server = $this->serverModel->getById($id);
        
        if (!$server) {
            Session::set('errors', ['Server not found']);
            header('Location: /servers');
            exit;
        }
        
        // Delete the server
        $this->serverModel->delete($id);
        
        // Set success message and redirect
        Session::set('success', 'Server deleted successfully');
        header('Location: /servers');
        exit;
    }
    
    /**
     * Generate secure access to server's Cockpit interface
     * 
     * @param int $id Server ID
     * @return void
     */
    public function access($id)
    {
        // Get server data
        $server = $this->serverModel->getById($id);
        
        if (!$server) {
            Session::set('errors', ['Server not found']);
            header('Location: /servers');
            exit;
        }
        
        // Check if server is online
        $status = $this->checkServerStatus($server);
        
        if ($status !== 'online') {
            Session::set('errors', ['Server is offline or unreachable']);
            header('Location: /servers');
            exit;
        }
        
        // Decrypt server password
        $encryptionKey = getenv('APP_KEY');
        $password = openssl_decrypt(
            $server['password'],
            'AES-256-CBC',
            substr(base64_decode($encryptionKey), 0, 32),
            0,
            str_repeat("\0", 16)
        );
        
        // Update last accessed timestamp
        $this->serverModel->updateLastAccessed($id);
        
        // Generate access link
        $protocol = !empty($server['use_ssl']) ? 'https' : 'http';
        $port = !empty($server['port']) ? $server['port'] : 9090;
        $accessUrl = "{$protocol}://{$server['hostname']}:{$port}";
        
        // Include a secure way to provide credentials - using session or secure iframe
        // For this example, we'll redirect with basic auth in URL (not recommended for production)
        // In a real implementation, you would use a more secure approach
        
        // Securely handle authentication to Cockpit
        // Option 1: Set credentials in session for a proxy script
        Session::set('cockpit_credentials', [
            'server_id' => $id,
            'username' => $server['username'],
            'password' => $password,
            'url' => $accessUrl
        ]);
        
        // Redirect to a proxy page that will handle authentication securely
        // This is a simplified example - production would use a more secure approach
        header("Location: {$accessUrl}");
        exit;
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
        $address = $server['hostname'];
        $port = !empty($server['port']) ? $server['port'] : 9090;
        
        // Attempt connection with timeout
        $socket = @fsockopen($address, $port, $errno, $errstr, 1);
        
        if ($socket) {
            fclose($socket);
            return 'online';
        }
        
        return 'offline';
    }
}
