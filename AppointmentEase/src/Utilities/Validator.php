<?php
namespace Src\Utilities;

/**
 * Validator Utility
 * 
 * Provides methods for data validation
 */
class Validator
{
    /**
     * Validation errors
     *
     * @var array
     */
    private $errors = [];
    
    /**
     * Validate input data
     *
     * @param array $data Array of [field => [value, rules]]
     * @return bool
     */
    public function validate($data)
    {
        $this->errors = [];
        
        foreach ($data as $field => $config) {
            list($value, $rules) = $config;
            
            $this->validateField($field, $value, $rules);
        }
        
        return empty($this->errors);
    }
    
    /**
     * Validate a single field
     *
     * @param string $field Field name
     * @param mixed $value Field value
     * @param string $rulesStr Pipe-separated rules
     * @return void
     */
    private function validateField($field, $value, $rulesStr)
    {
        $rules = explode('|', $rulesStr);
        
        $field = ucwords(str_replace('_', ' ', $field));
        
        foreach ($rules as $rule) {
            if (strpos($rule, ':') !== false) {
                list($ruleName, $ruleValue) = explode(':', $rule, 2);
            } else {
                $ruleName = $rule;
                $ruleValue = null;
            }
            
            $this->applyRule($field, $value, $ruleName, $ruleValue);
        }
    }
    
    /**
     * Apply a validation rule
     *
     * @param string $field Field name
     * @param mixed $value Field value
     * @param string $rule Rule name
     * @param string|null $ruleValue Rule parameter
     * @return void
     */
    private function applyRule($field, $value, $rule, $ruleValue)
    {
        switch ($rule) {
            case 'required':
                if (empty($value) && $value !== '0' && $value !== 0) {
                    $this->errors[] = "{$field} is required";
                }
                break;
                
            case 'min':
                if (is_string($value) && mb_strlen($value) < $ruleValue) {
                    $this->errors[] = "{$field} must be at least {$ruleValue} characters";
                } elseif (is_numeric($value) && $value < $ruleValue) {
                    $this->errors[] = "{$field} must be at least {$ruleValue}";
                }
                break;
                
            case 'max':
                if (is_string($value) && mb_strlen($value) > $ruleValue) {
                    $this->errors[] = "{$field} must not exceed {$ruleValue} characters";
                } elseif (is_numeric($value) && $value > $ruleValue) {
                    $this->errors[] = "{$field} must not exceed {$ruleValue}";
                }
                break;
                
            case 'email':
                if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->errors[] = "{$field} must be a valid email address";
                }
                break;
                
            case 'numeric':
                if (!empty($value) && !is_numeric($value)) {
                    $this->errors[] = "{$field} must be numeric";
                }
                break;
                
            case 'alphanumeric':
                if (!empty($value) && !ctype_alnum($value)) {
                    $this->errors[] = "{$field} must contain only letters and numbers";
                }
                break;
                
            case 'match':
                $matchField = ucwords(str_replace('_', ' ', $ruleValue));
                
                if ($value !== $_POST[$ruleValue]) {
                    $this->errors[] = "{$field} and {$matchField} must match";
                }
                break;
        }
    }
    
    /**
     * Check if validation has errors
     *
     * @return bool
     */
    public function hasErrors()
    {
        return !empty($this->errors);
    }
    
    /**
     * Get all validation errors
     *
     * @return array
     */
    public function getErrors()
    {
        return $this->errors;
    }
}
