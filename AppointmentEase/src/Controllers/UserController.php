<?php
namespace Src\Controllers;

use Src\Models\User;
use Src\Middleware\AuthMiddleware;
use Src\Utilities\Session;
use Src\Utilities\Validator;

/**
 * User Controller
 * 
 * Handles user management functionality
 */
class UserController
{
    /**
     * User model instance
     *
     * @var User
     */
    private $userModel;
    
    /**
     * Constructor - enforce authentication and admin rights
     */
    public function __construct()
    {
        AuthMiddleware::authenticate();
        AuthMiddleware::requireAdmin();
        
        $this->userModel = new User();
    }
    
    /**
     * Display list of users
     * 
     * @return void
     */
    public function index()
    {
        // Get all users
        $users = $this->userModel->getAll();
        
        // Include users list view
        include VIEW_PATH . '/users/index.php';
    }
    
    /**
     * Show user creation form
     * 
     * @return void
     */
    public function create()
    {
        // Include create user view
        include VIEW_PATH . '/users/create.php';
    }
    
    /**
     * Store a new user
     * 
     * @return void
     */
    public function store()
    {
        // Validate form input
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        $fullName = $_POST['full_name'] ?? '';
        $email = $_POST['email'] ?? '';
        $isAdmin = isset($_POST['is_admin']) ? 1 : 0;
        
        // Validate input
        $validator = new Validator();
        $validator->validate([
            'username' => [$username, 'required|alphanumeric|min:3|max:50'],
            'password' => [$password, 'required|min:8'],
            'confirm_password' => [$confirmPassword, 'required|match:password'],
            'full_name' => [$fullName, 'required|max:100'],
            'email' => [$email, 'required|email|max:100'],
        ]);
        
        // Check for validation errors
        if ($validator->hasErrors()) {
            Session::set('errors', $validator->getErrors());
            Session::set('old', $_POST);
            header('Location: /users/create');
            exit;
        }
        
        // Check if username already exists
        if ($this->userModel->getByUsername($username)) {
            Session::set('errors', ['Username already exists']);
            Session::set('old', $_POST);
            header('Location: /users/create');
            exit;
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Create user
        $userData = [
            'username' => $username,
            'password' => $hashedPassword,
            'full_name' => $fullName,
            'email' => $email,
            'is_admin' => $isAdmin,
        ];
        
        $this->userModel->create($userData);
        
        // Set success message and redirect
        Session::set('success', 'User created successfully');
        header('Location: /users');
        exit;
    }
    
    /**
     * Show user edit form
     * 
     * @param int $id User ID
     * @return void
     */
    public function edit($id)
    {
        // Get user data
        $user = $this->userModel->getById($id);
        
        if (!$user) {
            Session::set('errors', ['User not found']);
            header('Location: /users');
            exit;
        }
        
        // Include edit user view
        include VIEW_PATH . '/users/edit.php';
    }
    
    /**
     * Update user data
     * 
     * @param int $id User ID
     * @return void
     */
    public function update($id)
    {
        // Get user data
        $user = $this->userModel->getById($id);
        
        if (!$user) {
            Session::set('errors', ['User not found']);
            header('Location: /users');
            exit;
        }
        
        // Validate form input
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        $fullName = $_POST['full_name'] ?? '';
        $email = $_POST['email'] ?? '';
        $isAdmin = isset($_POST['is_admin']) ? 1 : 0;
        
        // Validate input
        $validator = new Validator();
        $validator->validate([
            'username' => [$username, 'required|alphanumeric|min:3|max:50'],
            'full_name' => [$fullName, 'required|max:100'],
            'email' => [$email, 'required|email|max:100'],
        ]);
        
        // Validate password if provided
        if (!empty($password)) {
            $validator->validate([
                'password' => [$password, 'min:8'],
                'confirm_password' => [$confirmPassword, 'match:password'],
            ]);
        }
        
        // Check for validation errors
        if ($validator->hasErrors()) {
            Session::set('errors', $validator->getErrors());
            Session::set('old', $_POST);
            header("Location: /users/edit/{$id}");
            exit;
        }
        
        // Check if username already exists (for another user)
        $existingUser = $this->userModel->getByUsername($username);
        if ($existingUser && $existingUser['id'] != $id) {
            Session::set('errors', ['Username already exists']);
            Session::set('old', $_POST);
            header("Location: /users/edit/{$id}");
            exit;
        }
        
        // Prepare user data
        $userData = [
            'username' => $username,
            'full_name' => $fullName,
            'email' => $email,
            'is_admin' => $isAdmin,
        ];
        
        // Update password if provided
        if (!empty($password)) {
            $userData['password'] = password_hash($password, PASSWORD_DEFAULT);
        }
        
        // Update user
        $this->userModel->update($id, $userData);
        
        // Set success message and redirect
        Session::set('success', 'User updated successfully');
        header('Location: /users');
        exit;
    }
    
    /**
     * Delete a user
     * 
     * @param int $id User ID
     * @return void
     */
    public function delete($id)
    {
        // Prevent self-deletion
        if ($id == Session::get('user_id')) {
            Session::set('errors', ['You cannot delete your own account']);
            header('Location: /users');
            exit;
        }
        
        // Check if user exists
        $user = $this->userModel->getById($id);
        
        if (!$user) {
            Session::set('errors', ['User not found']);
            header('Location: /users');
            exit;
        }
        
        // Delete the user
        $this->userModel->delete($id);
        
        // Set success message and redirect
        Session::set('success', 'User deleted successfully');
        header('Location: /users');
        exit;
    }
}
