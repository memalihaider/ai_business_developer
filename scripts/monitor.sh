#!/bin/bash

# =============================================================================
# AI Business Developer - Server Monitoring Script
# =============================================================================

# Configuration
APP_NAME="ai-business-dev"
APP_URL="http://localhost:3000"
LOG_FILE="/var/log/monitoring.log"
ALERT_EMAIL="admin@yourdomain.com"  # Change this to your email
MAX_CPU_USAGE=80
MAX_MEMORY_USAGE=80
MAX_DISK_USAGE=85

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a $LOG_FILE
}

# Send alert function (requires mail command)
send_alert() {
    local subject="$1"
    local message="$2"
    
    # Log the alert
    log_error "ALERT: $subject - $message"
    
    # Send email if mail command is available
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" $ALERT_EMAIL
    fi
    
    # You can also integrate with other alerting systems here
    # Example: Slack webhook, Discord webhook, etc.
}

# =============================================================================
# SYSTEM MONITORING FUNCTIONS
# =============================================================================

# Check CPU usage
check_cpu() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    cpu_usage=${cpu_usage%.*}  # Remove decimal part
    
    if [ "$cpu_usage" -gt "$MAX_CPU_USAGE" ]; then
        log_warning "High CPU usage detected: ${cpu_usage}%"
        send_alert "High CPU Usage Alert" "CPU usage is at ${cpu_usage}%, which exceeds the threshold of ${MAX_CPU_USAGE}%"
    else
        log "CPU usage: ${cpu_usage}%"
    fi
}

# Check memory usage
check_memory() {
    local memory_info=$(free | grep Mem)
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$((used_memory * 100 / total_memory))
    
    if [ "$memory_usage" -gt "$MAX_MEMORY_USAGE" ]; then
        log_warning "High memory usage detected: ${memory_usage}%"
        send_alert "High Memory Usage Alert" "Memory usage is at ${memory_usage}%, which exceeds the threshold of ${MAX_MEMORY_USAGE}%"
    else
        log "Memory usage: ${memory_usage}%"
    fi
}

# Check disk usage
check_disk() {
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt "$MAX_DISK_USAGE" ]; then
        log_warning "High disk usage detected: ${disk_usage}%"
        send_alert "High Disk Usage Alert" "Disk usage is at ${disk_usage}%, which exceeds the threshold of ${MAX_DISK_USAGE}%"
    else
        log "Disk usage: ${disk_usage}%"
    fi
}

# Check application status
check_application() {
    # Check if PM2 process is running
    if pm2 describe $APP_NAME | grep -q "online"; then
        log_success "Application $APP_NAME is running"
        
        # Check application response
        if curl -f -s $APP_URL > /dev/null; then
            log_success "Application is responding to HTTP requests"
        else
            log_error "Application is not responding to HTTP requests"
            send_alert "Application Not Responding" "The application at $APP_URL is not responding to HTTP requests"
        fi
    else
        log_error "Application $APP_NAME is not running"
        send_alert "Application Down" "The application $APP_NAME is not running in PM2"
        
        # Attempt to restart
        log "Attempting to restart application..."
        pm2 restart $APP_NAME
        sleep 10
        
        if pm2 describe $APP_NAME | grep -q "online"; then
            log_success "Application restarted successfully"
        else
            log_error "Failed to restart application"
            send_alert "Application Restart Failed" "Failed to restart application $APP_NAME"
        fi
    fi
}

# Check Nginx status
check_nginx() {
    if systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
    else
        log_error "Nginx is not running"
        send_alert "Nginx Down" "Nginx web server is not running"
        
        # Attempt to restart
        log "Attempting to restart Nginx..."
        sudo systemctl start nginx
        
        if systemctl is-active --quiet nginx; then
            log_success "Nginx restarted successfully"
        else
            log_error "Failed to restart Nginx"
            send_alert "Nginx Restart Failed" "Failed to restart Nginx web server"
        fi
    fi
}

# Check database status
check_database() {
    # Check PostgreSQL if it's being used
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL is running"
        
        # Test database connection
        if pg_isready -q; then
            log_success "Database is accepting connections"
        else
            log_error "Database is not accepting connections"
            send_alert "Database Connection Failed" "PostgreSQL is running but not accepting connections"
        fi
    else
        # Check if PostgreSQL service exists
        if systemctl list-unit-files | grep -q postgresql; then
            log_error "PostgreSQL is not running"
            send_alert "Database Down" "PostgreSQL database server is not running"
        else
            log "PostgreSQL service not found (might be using SQLite)"
        fi
    fi
}

# Check SSL certificate expiry
check_ssl_certificate() {
    local domain="yourdomain.com"  # Change this to your domain
    
    if [ -f "/etc/letsencrypt/live/$domain/cert.pem" ]; then
        local expiry_date=$(openssl x509 -in /etc/letsencrypt/live/$domain/cert.pem -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ "$days_until_expiry" -lt 30 ]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
            send_alert "SSL Certificate Expiring Soon" "SSL certificate for $domain expires in $days_until_expiry days"
        else
            log "SSL certificate is valid for $days_until_expiry more days"
        fi
    else
        log "SSL certificate not found or domain not configured"
    fi
}

# Check log file sizes
check_log_sizes() {
    local max_log_size=100  # MB
    
    # Check PM2 logs
    local pm2_log_dir="$HOME/.pm2/logs"
    if [ -d "$pm2_log_dir" ]; then
        for log_file in $pm2_log_dir/*.log; do
            if [ -f "$log_file" ]; then
                local file_size=$(du -m "$log_file" | cut -f1)
                if [ "$file_size" -gt "$max_log_size" ]; then
                    log_warning "Large log file detected: $log_file (${file_size}MB)"
                fi
            fi
        done
    fi
    
    # Check Nginx logs
    for log_file in /var/log/nginx/*.log; do
        if [ -f "$log_file" ]; then
            local file_size=$(du -m "$log_file" | cut -f1)
            if [ "$file_size" -gt "$max_log_size" ]; then
                log_warning "Large Nginx log file: $log_file (${file_size}MB)"
            fi
        fi
    done
}

# =============================================================================
# PERFORMANCE MONITORING
# =============================================================================

# Check application performance
check_performance() {
    log "Checking application performance..."
    
    # Measure response time
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' $APP_URL)
    local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
    
    if [ "$response_time_ms" -gt 5000 ]; then
        log_warning "Slow response time detected: ${response_time_ms}ms"
        send_alert "Slow Application Response" "Application response time is ${response_time_ms}ms"
    else
        log "Application response time: ${response_time_ms}ms"
    fi
    
    # Check PM2 process metrics
    pm2 describe $APP_NAME | grep -E "(cpu|memory|restart)" | while read line; do
        log "PM2 Metrics: $line"
    done
}

# =============================================================================
# MAIN MONITORING FUNCTION
# =============================================================================

run_monitoring() {
    log "=============================================================================="
    log "Starting system monitoring check..."
    log "=============================================================================="
    
    # System checks
    check_cpu
    check_memory
    check_disk
    
    # Service checks
    check_application
    check_nginx
    check_database
    
    # Security and maintenance checks
    check_ssl_certificate
    check_log_sizes
    
    # Performance checks
    check_performance
    
    log "=============================================================================="
    log "Monitoring check completed"
    log "=============================================================================="
}

# =============================================================================
# COMMAND LINE OPTIONS
# =============================================================================

case "$1" in
    "cpu")
        check_cpu
        ;;
    "memory")
        check_memory
        ;;
    "disk")
        check_disk
        ;;
    "app")
        check_application
        ;;
    "nginx")
        check_nginx
        ;;
    "database")
        check_database
        ;;
    "ssl")
        check_ssl_certificate
        ;;
    "performance")
        check_performance
        ;;
    "logs")
        check_log_sizes
        ;;
    "status")
        echo "=== System Status ==="
        echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
        echo "Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
        echo "Disk Usage: $(df / | tail -1 | awk '{print $5}')"
        echo "Application: $(pm2 describe $APP_NAME | grep 'status' | awk '{print $4}')"
        echo "Nginx: $(systemctl is-active nginx)"
        if systemctl list-unit-files | grep -q postgresql; then
            echo "PostgreSQL: $(systemctl is-active postgresql)"
        fi
        ;;
    *)
        if [ -n "$1" ]; then
            echo "Unknown option: $1"
            echo ""
        fi
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  cpu         - Check CPU usage"
        echo "  memory      - Check memory usage"
        echo "  disk        - Check disk usage"
        echo "  app         - Check application status"
        echo "  nginx       - Check Nginx status"
        echo "  database    - Check database status"
        echo "  ssl         - Check SSL certificate"
        echo "  performance - Check application performance"
        echo "  logs        - Check log file sizes"
        echo "  status      - Show quick system status"
        echo ""
        echo "Run without options to perform full monitoring check"
        echo ""
        echo "To set up automated monitoring, add to crontab:"
        echo "*/5 * * * * /path/to/monitor.sh >> /var/log/monitoring.log 2>&1"
        
        if [ -z "$1" ]; then
            echo ""
            run_monitoring
        fi
        ;;
esac