<?php
namespace Src\Models;

use Src\Models\Database;

/**
 * User Model
 * 
 * Handles database operations for user management
 */
class User
{
    /**
     * Database connection instance
     *
     * @var Database
     */
    private $db;
    
    /**
     * Constructor
     */
    public function __construct()
    {
        $this->db = new Database();
    }
    
    /**
     * Get all users
     *
     * @return array
     */
    public function getAll()
    {
        $query = "SELECT id, username, full_name, email, is_admin, created_at, last_login 
                  FROM users 
                  ORDER BY username";
        
        return $this->db->query($query);
    }
    
    /**
     * Get user by ID
     *
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        $query = "SELECT id, username, full_name, email, is_admin, created_at, last_login 
                  FROM users 
                  WHERE id = :id";
        
        $params = [':id' => $id];
        $result = $this->db->query($query, $params);
        
        return $result ? $result[0] : null;
    }
    
    /**
     * Get user by username
     *
     * @param string $username
     * @return array|null
     */
    public function getByUsername($username)
    {
        $query = "SELECT id, username, password, full_name, email, is_admin, created_at, last_login 
                  FROM users 
                  WHERE username = :username";
        
        $params = [':username' => $username];
        $result = $this->db->query($query, $params);
        
        return $result ? $result[0] : null;
    }
    
    /**
     * Create a new user
     *
     * @param array $userData
     * @return bool
     */
    public function create($userData)
    {
        $query = "INSERT INTO users (username, password, full_name, email, is_admin, created_at) 
                  VALUES (:username, :password, :full_name, :email, :is_admin, NOW())";
        
        $params = [
            ':username' => $userData['username'],
            ':password' => $userData['password'],
            ':full_name' => $userData['full_name'],
            ':email' => $userData['email'],
            ':is_admin' => $userData['is_admin']
        ];
        
        return $this->db->execute($query, $params);
    }
    
    /**
     * Update a user
     *
     * @param int $id
     * @param array $userData
     * @return bool
     */
    public function update($id, $userData)
    {
        $fields = [];
        $params = [':id' => $id];
        
        // Build update fields dynamically based on provided data
        foreach ($userData as $field => $value) {
            $fields[] = "{$field} = :{$field}";
            $params[":{$field}"] = $value;
        }
        
        $fieldsStr = implode(', ', $fields);
        
        $query = "UPDATE users SET {$fieldsStr} WHERE id = :id";
        
        return $this->db->execute($query, $params);
    }
    
    /**
     * Delete a user
     *
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        $query = "DELETE FROM users WHERE id = :id";
        $params = [':id' => $id];
        
        return $this->db->execute($query, $params);
    }
    
    /**
     * Update last login time
     *
     * @param int $id
     * @return bool
     */
    public function updateLastLogin($id)
    {
        $query = "UPDATE users SET last_login = NOW() WHERE id = :id";
        $params = [':id' => $id];
        
        return $this->db->execute($query, $params);
    }
}
