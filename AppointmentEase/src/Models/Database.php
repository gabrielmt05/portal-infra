<?php
namespace Src\Models;

use PDO;
use PDOException;

/**
 * Database Model
 * 
 * Handles database connections and operations
 */
class Database
{
    /**
     * PDO connection instance
     *
     * @var PDO
     */
    private $connection;
    
    /**
     * Constructor - establish database connection
     */
    public function __construct()
    {
        $config = require_once CONFIG_PATH . '/database.php';
        
        $dsn = "{$config['driver']}:host={$config['host']};port={$config['port']};dbname={$config['database']}";
        
        try {
            $this->connection = new PDO(
                $dsn,
                $config['username'],
                $config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            // Log error and display user-friendly message
            error_log("Database connection error: " . $e->getMessage());
            die("Database connection failed. Please contact the administrator.");
        }
    }
    
    /**
     * Execute a query and return results
     *
     * @param string $query SQL query
     * @param array $params Named parameters for the query
     * @return array|false Results or false on failure
     */
    public function query($query, $params = [])
    {
        try {
            $statement = $this->connection->prepare($query);
            $statement->execute($params);
            
            return $statement->fetchAll();
        } catch (PDOException $e) {
            // Log error and return false
            error_log("Database query error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Execute a query without returning results
     *
     * @param string $query SQL query
     * @param array $params Named parameters for the query
     * @return bool Success or failure
     */
    public function execute($query, $params = [])
    {
        try {
            $statement = $this->connection->prepare($query);
            return $statement->execute($params);
        } catch (PDOException $e) {
            // Log error and return false
            error_log("Database execute error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get the ID of the last inserted row
     *
     * @return string
     */
    public function lastInsertId()
    {
        return $this->connection->lastInsertId();
    }
    
    /**
     * Start a transaction
     *
     * @return bool
     */
    public function beginTransaction()
    {
        return $this->connection->beginTransaction();
    }
    
    /**
     * Commit a transaction
     *
     * @return bool
     */
    public function commit()
    {
        return $this->connection->commit();
    }
    
    /**
     * Roll back a transaction
     *
     * @return bool
     */
    public function rollBack()
    {
        return $this->connection->rollBack();
    }
}
