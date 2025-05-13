<?php
namespace Src\Models;

use Src\Models\Database;

/**
 * Server Model
 * 
 * Handles database operations for server management
 */
class Server
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
     * Get all servers
     *
     * @return array
     */
    public function getAll()
    {
        $query = "SELECT s.id, s.name, s.hostname, s.description, s.port, s.username, 
                         s.use_ssl, s.created_at, s.last_accessed, u.username as created_by_user
                  FROM servers s
                  LEFT JOIN users u ON s.created_by = u.id
                  ORDER BY s.name";
        
        return $this->db->query($query);
    }
    
    /**
     * Get server by ID
     *
     * @param int $id
     * @return array|null
     */
    public function getById($id)
    {
        $query = "SELECT s.id, s.name, s.hostname, s.description, s.port, s.username, s.password,
                         s.use_ssl, s.created_at, s.last_accessed, 
                         s.created_by, u.username as created_by_user
                  FROM servers s
                  LEFT JOIN users u ON s.created_by = u.id
                  WHERE s.id = :id";
        
        $params = [':id' => $id];
        $result = $this->db->query($query, $params);
        
        return $result ? $result[0] : null;
    }
    
    /**
     * Create a new server
     *
     * @param array $serverData
     * @return bool
     */
    public function create($serverData)
    {
        $query = "INSERT INTO servers (name, hostname, description, port, username, password, 
                                       use_ssl, created_by, created_at)
                  VALUES (:name, :hostname, :description, :port, :username, :password, 
                          :use_ssl, :created_by, NOW())";
        
        $params = [
            ':name' => $serverData['name'],
            ':hostname' => $serverData['hostname'],
            ':description' => $serverData['description'] ?? null,
            ':port' => $serverData['port'] ?? 9090,
            ':username' => $serverData['username'],
            ':password' => $serverData['password'],
            ':use_ssl' => $serverData['use_ssl'] ?? false,
            ':created_by' => $serverData['created_by']
        ];
        
        return $this->db->execute($query, $params);
    }
    
    /**
     * Update a server
     *
     * @param int $id
     * @param array $serverData
     * @return bool
     */
    public function update($id, $serverData)
    {
        $fields = [];
        $params = [':id' => $id];
        
        // Build update fields dynamically based on provided data
        foreach ($serverData as $field => $value) {
            $fields[] = "{$field} = :{$field}";
            $params[":{$field}"] = $value;
        }
        
        $fieldsStr = implode(', ', $fields);
        
        $query = "UPDATE servers SET {$fieldsStr} WHERE id = :id";
        
        return $this->db->execute($query, $params);
    }
    
    /**
     * Delete a server
     *
     * @param int $id
     * @return bool
     */
    public function delete($id)
    {
        $query = "DELETE FROM servers WHERE id = :id";
        $params = [':id' => $id];
        
        return $this->db->execute($query, $params);
    }
    
    /**
     * Update last accessed timestamp
     *
     * @param int $id
     * @return bool
     */
    public function updateLastAccessed($id)
    {
        $query = "UPDATE servers SET last_accessed = NOW() WHERE id = :id";
        $params = [':id' => $id];
        
        return $this->db->execute($query, $params);
    }
    
    /**
     * Get recent servers for a user
     *
     * @param int $userId
     * @param int $limit
     * @return array
     */
    public function getRecentServers($userId, $limit = 5)
    {
        $query = "SELECT s.id, s.name, s.hostname, s.description, s.port, s.username, 
                         s.use_ssl, s.last_accessed
                  FROM servers s
                  JOIN access_logs a ON s.id = a.server_id
                  WHERE a.user_id = :user_id
                  ORDER BY a.accessed_at DESC
                  LIMIT :limit";
        
        $params = [
            ':user_id' => $userId,
            ':limit' => $limit
        ];
        
        return $this->db->query($query, $params);
    }
    
    /**
     * Log server access
     *
     * @param int $serverId
     * @param int $userId
     * @return bool
     */
    public function logAccess($serverId, $userId)
    {
        $query = "INSERT INTO access_logs (server_id, user_id, accessed_at)
                  VALUES (:server_id, :user_id, NOW())";
        
        $params = [
            ':server_id' => $serverId,
            ':user_id' => $userId
        ];
        
        return $this->db->execute($query, $params);
    }
}
