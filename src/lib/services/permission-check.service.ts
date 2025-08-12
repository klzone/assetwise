/**
 * 权限检查服务
 * 负责处理用户权限验证、资源所有权检查等权限相关功能
 */
export class PermissionCheckService {
  private supabaseClient: any;
  
  /**
   * 构造函数
   * @param supabaseClient Supabase客户端实例
   */
  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
  }
  
  /**
   * 检查用户是否具有指定角色
   * @param user 用户对象
   * @param role 角色名称
   * @returns 是否具有该角色
   */
  hasRole(user: any, role: string): boolean {
    if (!user || !user.user_metadata || !user.user_metadata.role) {
      return false;
    }
    
    return user.user_metadata.role === role;
  }
  
  /**
   * 检查用户是否具有指定权限
   * @param userId 用户ID
   * @param permission 权限名称
   * @returns 是否具有该权限
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient.rpc('check_user_permission', {
        user_id: userId,
        permission: permission
      });
      
      if (error) {
        console.error('检查权限失败:', error.message);
        return false;
      }
      
      return !!data;
    } catch (error: any) {
      console.error('检查权限异常:', error.message);
      return false;
    }
  }
  
  /**
   * 检查用户是否是资源所有者
   * @param userId 用户ID
   * @param resourceTable 资源表名
   * @param resourceId 资源ID
   * @returns 是否是资源所有者
   */
  async isResourceOwner(userId: string, resourceTable: string, resourceId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .from(resourceTable)
        .select('*')
        .eq('id', resourceId)
        .single();
      
      if (error || !data) {
        console.error('获取资源失败:', error?.message || '资源不存在');
        return false;
      }
      
      // 检查资源是否属于该用户
      return data.owner_id === userId;
    } catch (error: any) {
      console.error('检查资源所有权异常:', error.message);
      return false;
    }
  }
  
  /**
   * 检查用户是否可以访问资源
   * @param userId 用户ID
   * @param resourceTable 资源表名
   * @param resourceId 资源ID
   * @param action 操作类型（如'read'、'write'、'delete'等）
   * @returns 是否可以访问
   */
  async canAccessResource(userId: string, resourceTable: string, resourceId: string, action: string): Promise<boolean> {
    // 检查是否是资源所有者
    const isOwner = await this.isResourceOwner(userId, resourceTable, resourceId);
    
    // 如果是所有者，直接允许访问
    if (isOwner) {
      return true;
    }
    
    // 如果不是所有者，检查是否有相应权限
    // 权限名称格式：action_resourceTable，例如：read_assets
    const permissionName = `${action}_${resourceTable}`;
    return await this.hasPermission(userId, permissionName);
  }
}