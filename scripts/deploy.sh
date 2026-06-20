#!/bin/bash
set -e

# AssetWise 自动化部署脚本
# 支持开发、测试、预发布和生产环境

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
AssetWise 部署脚本

用法: $0 [选项] <环境>

环境:
    dev         开发环境
    staging     预发布环境
    production  生产环境

选项:
    -h, --help              显示帮助信息
    -v, --version VERSION   指定部署版本 (默认: latest)
    -f, --force             强制部署，跳过确认
    -d, --dry-run           模拟运行，不执行实际部署
    -m, --migrate           运行数据库迁移
    -b, --build             重新构建镜像
    -t, --test              运行部署后测试
    --rollback VERSION      回滚到指定版本

示例:
    $0 staging                      # 部署到预发布环境
    $0 production -v v1.2.3         # 部署特定版本到生产环境
    $0 production --rollback v1.2.2 # 回滚生产环境
    $0 dev -b -t                    # 重新构建并测试开发环境

EOF
}

# 默认值
ENVIRONMENT=""
VERSION="latest"
FORCE=false
DRY_RUN=false
MIGRATE=false
BUILD=false
TEST=false
ROLLBACK=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -m|--migrate)
            MIGRATE=true
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -t|--test)
            TEST=true
            shift
            ;;
        --rollback)
            ROLLBACK="$2"
            shift 2
            ;;
        dev|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 验证环境参数
if [[ -z "$ENVIRONMENT" ]]; then
    log_error "请指定部署环境 (dev/staging/production)"
    show_help
    exit 1
fi

# 验证环境是否有效
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    log_error "无效的环境: $ENVIRONMENT"
    exit 1
fi

# 验证必需的工具
check_dependencies() {
    local deps=("docker" "docker-compose" "kubectl" "jq")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "缺少必需的工具: $dep"
            exit 1
        fi
    done
    
    log_success "所有依赖工具已安装"
}

# 加载环境配置
load_config() {
    local config_file="config/${ENVIRONMENT}.env"
    
    if [[ -f "$config_file" ]]; then
        log_info "加载环境配置: $config_file"
        source "$config_file"
    else
        log_warning "环境配置文件不存在: $config_file"
    fi
}

# 验证配置
validate_config() {
    local required_vars=()
    
    case "$ENVIRONMENT" in
        production)
            required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "SUPABASE_SERVICE_ROLE_KEY")
            ;;
        staging)
            required_vars=("DATABASE_URL" "NEXTAUTH_SECRET")
            ;;
        dev)
            required_vars=()
            ;;
    esac
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "缺少必需的环境变量: $var"
            exit 1
        fi
    done
    
    log_success "配置验证通过"
}

# 构建 Docker 镜像
build_image() {
    if [[ "$BUILD" == "true" ]] || [[ "$VERSION" == "latest" ]]; then
        log_info "构建 Docker 镜像..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] docker build -t assetwise:$VERSION ."
        else
            docker build -t "assetwise:$VERSION" .
            
            if [[ "$ENVIRONMENT" != "dev" ]]; then
                # 推送到镜像仓库
                docker tag "assetwise:$VERSION" "ghcr.io/assetwise/assetwise:$VERSION"
                docker push "ghcr.io/assetwise/assetwise:$VERSION"
            fi
        fi
        
        log_success "镜像构建完成"
    fi
}

# 数据库迁移
run_migrations() {
    if [[ "$MIGRATE" == "true" ]]; then
        log_info "运行数据库迁移..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] 模拟数据库迁移"
        else
            case "$ENVIRONMENT" in
                dev)
                    docker-compose exec app npm run db:migrate
                    ;;
                staging|production)
                    kubectl exec -n assetwise deployment/assetwise-app -- npm run db:migrate
                    ;;
            esac
        fi
        
        log_success "数据库迁移完成"
    fi
}

# 部署到开发环境
deploy_dev() {
    log_info "部署到开发环境..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] docker-compose up -d"
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    fi
    
    log_success "开发环境部署完成"
}

# 部署到 Kubernetes
deploy_k8s() {
    local namespace="assetwise"
    
    log_info "部署到 Kubernetes ($ENVIRONMENT)..."
    
    # 更新镜像版本
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] kubectl set image deployment/assetwise-app assetwise=ghcr.io/assetwise/assetwise:$VERSION -n $namespace"
    else
        kubectl set image deployment/assetwise-app assetwise="ghcr.io/assetwise/assetwise:$VERSION" -n "$namespace"
        
        # 等待部署完成
        kubectl rollout status deployment/assetwise-app -n "$namespace" --timeout=600s
    fi
    
    log_success "Kubernetes 部署完成"
}

# 回滚部署
rollback_deployment() {
    log_info "回滚到版本: $ROLLBACK"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] 模拟回滚操作"
    else
        case "$ENVIRONMENT" in
            dev)
                VERSION="$ROLLBACK"
                docker-compose down
                docker-compose up -d
                ;;
            staging|production)
                kubectl set image deployment/assetwise-app assetwise="ghcr.io/assetwise/assetwise:$ROLLBACK" -n assetwise
                kubectl rollout status deployment/assetwise-app -n assetwise --timeout=600s
                ;;
        esac
    fi
    
    log_success "回滚完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local url=""
    case "$ENVIRONMENT" in
        dev)
            url="http://localhost:3000/health"
            ;;
        staging)
            url="https://staging.assetwise.app/health"
            ;;
        production)
            url="https://assetwise.app/health"
            ;;
    esac
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$url" > /dev/null; then
            log_success "健康检查通过"
            return 0
        fi
        
        log_info "健康检查失败，重试 ($attempt/$max_attempts)..."
        sleep 10
        ((attempt++))
    done
    
    log_error "健康检查失败"
    return 1
}

# 部署后测试
run_tests() {
    if [[ "$TEST" == "true" ]]; then
        log_info "运行部署后测试..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY RUN] 模拟测试运行"
        else
            # 运行烟雾测试
            npm run test:e2e:smoke
            
            # 运行API测试
            npm run test:api
        fi
        
        log_success "部署后测试完成"
    fi
}

# 通知部署结果
send_notification() {
    local status=$1
    local message="AssetWise $ENVIRONMENT 环境部署$status"
    
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    log_info "通知已发送: $message"
}

# 确认部署
confirm_deployment() {
    if [[ "$FORCE" == "true" ]] || [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi
    
    echo
    log_warning "即将部署到 $ENVIRONMENT 环境"
    echo "版本: $VERSION"
    echo "迁移: $MIGRATE"
    echo "构建: $BUILD"
    echo "测试: $TEST"
    echo
    
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
}

# 主函数
main() {
    log_info "开始 AssetWise 部署流程"
    log_info "环境: $ENVIRONMENT"
    log_info "版本: $VERSION"
    
    # 检查依赖
    check_dependencies
    
    # 加载配置
    load_config
    
    # 验证配置
    validate_config
    
    # 处理回滚
    if [[ -n "$ROLLBACK" ]]; then
        confirm_deployment
        rollback_deployment
        health_check
        send_notification "回滚成功"
        exit 0
    fi
    
    # 确认部署
    confirm_deployment
    
    # 构建镜像
    build_image
    
    # 运行迁移
    run_migrations
    
    # 执行部署
    case "$ENVIRONMENT" in
        dev)
            deploy_dev
            ;;
        staging|production)
            deploy_k8s
            ;;
    esac
    
    # 健康检查
    if ! health_check; then
        log_error "部署失败：健康检查未通过"
        send_notification "失败"
        exit 1
    fi
    
    # 运行测试
    run_tests
    
    # 发送成功通知
    send_notification "成功"
    
    log_success "部署完成！"
    
    # 显示访问地址
    case "$ENVIRONMENT" in
        dev)
            echo "访问地址: http://localhost:3000"
            ;;
        staging)
            echo "访问地址: https://staging.assetwise.app"
            ;;
        production)
            echo "访问地址: https://assetwise.app"
            ;;
    esac
}

# 陷阱处理
trap 'log_error "部署脚本被中断"; exit 1' INT TERM

# 执行主函数
main "$@"