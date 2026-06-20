/**
 * 移动端组件单元测试
 */

import React from 'react';
import { 
  TouchButton, 
  SwipeAction, 
  BottomSheet, 
  PullToRefresh,
  useGestures 
} from '@/components/mobile/mobile-optimized';
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor,
  TestEnvironment,
  TestAssertions,
  MockFactory
} from '@/lib/testing/test-utils';
import userEvent from '@testing-library/user-event';

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: MockFactory.createMockFn(),
});

describe('TouchButton', () => {
  beforeEach(() => {
    TestEnvironment.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该渲染按钮和内容', () => {
    render(<TouchButton>点击我</TouchButton>);
    
    const button = screen.getByRole('button');
    TestAssertions.expectElementToBeVisible(button);
    expect(button).toHaveTextContent('点击我');
  });

  it('应该应用正确的尺寸类', () => {
    const { rerender } = render(
      <TouchButton size="sm">小按钮</TouchButton>
    );
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[36px]');
    
    rerender(<TouchButton size="lg">大按钮</TouchButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[52px]');
  });

  it('应该应用正确的变体样式', () => {
    const { rerender } = render(
      <TouchButton variant="primary">主要按钮</TouchButton>
    );
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-500');
    
    rerender(<TouchButton variant="ghost">透明按钮</TouchButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent');
  });

  it('应该在点击时调用onClick处理函数', async () => {
    const handleClick = MockFactory.createMockFn();
    render(<TouchButton onClick={handleClick}>点击我</TouchButton>);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('应该在触摸设备上触发震动反馈', async () => {
    // 模拟触摸设备
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // 移动设备宽度
    });

    const handleClick = MockFactory.createMockFn();
    render(
      <TouchButton onClick={handleClick} haptic={true}>
        点击我
      </TouchButton>
    );
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(navigator.vibrate).toHaveBeenCalledWith(10);
  });

  it('应该显示波纹效果', async () => {
    render(<TouchButton ripple={true}>点击我</TouchButton>);
    
    const button = screen.getByRole('button');
    
    // 模拟点击事件以触发波纹
    fireEvent.click(button, {
      clientX: 100,
      clientY: 50,
    });
    
    // 检查是否有波纹元素被添加
    await waitFor(() => {
      const ripples = button.querySelectorAll('.animate-ping');
      expect(ripples.length).toBeGreaterThan(0);
    });
  });

  it('应该在禁用时不响应点击', async () => {
    const handleClick = MockFactory.createMockFn();
    render(
      <TouchButton onClick={handleClick} disabled>
        禁用按钮
      </TouchButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('应该支持自定义类名', () => {
    render(
      <TouchButton className="custom-class">
        自定义按钮
      </TouchButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('应该支持所有HTML按钮属性', () => {
    render(
      <TouchButton 
        type="submit" 
        form="test-form"
        data-testid="custom-button"
      >
        提交按钮
      </TouchButton>
    );
    
    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('form', 'test-form');
  });
});

describe('SwipeAction', () => {
  beforeEach(() => {
    TestEnvironment.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  const leftAction = {
    icon: <span>📧</span>,
    label: '邮件',
    color: 'bg-blue-500',
    onAction: MockFactory.createMockFn(),
  };

  const rightAction = {
    icon: <span>🗑️</span>,
    label: '删除',
    color: 'bg-red-500',
    onAction: MockFactory.createMockFn(),
  };

  it('应该渲染主要内容', () => {
    render(
      <SwipeAction leftAction={leftAction} rightAction={rightAction}>
        <div>滑动我</div>
      </SwipeAction>
    );
    
    expect(screen.getByText('滑动我')).toBeInTheDocument();
  });

  it('应该响应触摸滑动手势', () => {
    render(
      <SwipeAction rightAction={rightAction}>
        <div>滑动我</div>
      </SwipeAction>
    );
    
    const container = screen.getByText('滑动我').closest('div');
    expect(container).toBeInTheDocument();
    
    // 模拟向左滑动手势
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    
    fireEvent.touchEnd(container!, {
      changedTouches: [{ clientX: 50, clientY: 100 }],
    });
    
    // 应该显示右侧操作
    expect(screen.getByText('删除')).toBeInTheDocument();
  });

  it('应该在快速滑动时触发操作', async () => {
    render(
      <SwipeAction rightAction={rightAction}>
        <div>滑动我</div>
      </SwipeAction>
    );
    
    const container = screen.getByText('滑动我').closest('div');
    
    // 模拟快速向左滑动
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 20, clientY: 100 }],
    });
    
    fireEvent.touchEnd(container!, {
      changedTouches: [{ clientX: 20, clientY: 100 }],
    });
    
    // 等待操作执行
    await waitFor(() => {
      expect(rightAction.onAction).toHaveBeenCalledTimes(1);
    });
  });

  it('应该支持左右两个操作', () => {
    render(
      <SwipeAction leftAction={leftAction} rightAction={rightAction}>
        <div>滑动我</div>
      </SwipeAction>
    );
    
    const container = screen.getByText('滑动我').closest('div');
    
    // 测试向右滑动（显示左侧操作）
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    // 应该能看到邮件图标
    expect(screen.getByText('📧')).toBeInTheDocument();
  });

  it('应该在点击外部时重置状态', () => {
    render(
      <div>
        <SwipeAction rightAction={rightAction}>
          <div>滑动我</div>
        </SwipeAction>
        <div>外部区域</div>
      </div>
    );
    
    const container = screen.getByText('滑动我').closest('div');
    
    // 滑动显示操作
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    
    // 点击外部区域
    const outsideArea = screen.getByText('外部区域');
    fireEvent.click(outsideArea);
    
    // 操作应该被隐藏（通过检查transform值）
    const mainContent = screen.getByText('滑动我');
    expect(mainContent.style.transform).toBe('translateX(0px)');
  });
});

describe('BottomSheet', () => {
  beforeEach(() => {
    TestEnvironment.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该在打开时显示抽屉', () => {
    const onClose = MockFactory.createMockFn();
    
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <div>抽屉内容</div>
      </BottomSheet>
    );
    
    expect(screen.getByText('抽屉内容')).toBeInTheDocument();
  });

  it('应该在关闭时隐藏抽屉', () => {
    const onClose = MockFactory.createMockFn();
    
    render(
      <BottomSheet isOpen={false} onClose={onClose}>
        <div>抽屉内容</div>
      </BottomSheet>
    );
    
    expect(screen.queryByText('抽屉内容')).not.toBeInTheDocument();
  });

  it('应该在点击背景遮罩时关闭', async () => {
    const onClose = MockFactory.createMockFn();
    
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <div>抽屉内容</div>
      </BottomSheet>
    );
    
    // 找到背景遮罩并点击
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
    expect(backdrop).toBeInTheDocument();
    
    fireEvent.click(backdrop!);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('应该显示拖拽指示器', () => {
    const onClose = MockFactory.createMockFn();
    
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <div>抽屉内容</div>
      </BottomSheet>
    );
    
    // 查找拖拽指示器
    const indicator = document.querySelector('.w-10.h-1.bg-gray-300.rounded-full');
    expect(indicator).toBeInTheDocument();
  });

  it('应该支持自定义高度', () => {
    const onClose = MockFactory.createMockFn();
    
    render(
      <BottomSheet 
        isOpen={true} 
        onClose={onClose}
        height="80vh"
      >
        <div>抽屉内容</div>
      </BottomSheet>
    );
    
    const sheet = screen.getByText('抽屉内容').closest('.fixed.bottom-0');
    expect(sheet).toHaveStyle({ height: '80vh' });
  });

  it('应该响应下滑手势关闭', () => {
    const onClose = MockFactory.createMockFn();
    
    render(
      <BottomSheet isOpen={true} onClose={onClose}>
        <div>抽屉内容</div>
      </BottomSheet>
    );
    
    const sheet = screen.getByText('抽屉内容').closest('.fixed.bottom-0');
    
    // 模拟下滑手势
    fireEvent.touchStart(sheet!, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    
    fireEvent.touchMove(sheet!, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    
    fireEvent.touchEnd(sheet!, {
      changedTouches: [{ clientX: 200, clientY: 200 }],
    });
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('PullToRefresh', () => {
  beforeEach(() => {
    TestEnvironment.setup();
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该渲染子内容', () => {
    const onRefresh = MockFactory.createMockFn(() => Promise.resolve());
    
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>可刷新内容</div>
      </PullToRefresh>
    );
    
    expect(screen.getByText('可刷新内容')).toBeInTheDocument();
  });

  it('应该在下拉时显示刷新指示器', () => {
    const onRefresh = MockFactory.createMockFn(() => Promise.resolve());
    
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>可刷新内容</div>
      </PullToRefresh>
    );
    
    const container = screen.getByText('可刷新内容').closest('.relative.overflow-auto');
    
    // 模拟下拉手势
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    
    // 应该显示下拉指示器
    const indicator = container!.querySelector('.absolute.top-0');
    expect(indicator).toBeInTheDocument();
  });

  it('应该在达到阈值时触发刷新', async () => {
    const onRefresh = MockFactory.createMockFn(() => Promise.resolve());
    
    render(
      <PullToRefresh onRefresh={onRefresh} threshold={60}>
        <div>可刷新内容</div>
      </PullToRefresh>
    );
    
    const container = screen.getByText('可刷新内容').closest('.relative.overflow-auto');
    
    // 模拟超过阈值的下拉
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 200, clientY: 180 }], // 80px下拉，超过60px阈值
    });
    
    fireEvent.touchEnd(container!);
    
    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('应该在刷新时显示加载指示器', async () => {
    const onRefresh = MockFactory.createMockFn(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>可刷新内容</div>
      </PullToRefresh>
    );
    
    const container = screen.getByText('可刷新内容').closest('.relative.overflow-auto');
    
    // 触发刷新
    fireEvent.touchStart(container!, {
      touches: [{ clientX: 200, clientY: 100 }],
    });
    
    fireEvent.touchMove(container!, {
      touches: [{ clientX: 200, clientY: 180 }],
    });
    
    fireEvent.touchEnd(container!);
    
    // 检查加载指示器
    await waitFor(() => {
      const spinner = container!.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});

describe('useGestures Hook', () => {
  let TestComponent: React.FC<any>;

  beforeEach(() => {
    TestEnvironment.setup();
    
    TestComponent = ({ 
      onTap, 
      onSwipe, 
      onPinch, 
      onPan 
    }: any) => {
      const { touchProps, isTouch, touchCount } = useGestures({
        onTap,
        onSwipe,
        onPinch,
        onPan,
      });

      return (
        <div 
          data-testid="gesture-area"
          {...touchProps}
        >
          <div>触摸数量: {touchCount}</div>
          <div>触摸状态: {isTouch ? '触摸中' : '未触摸'}</div>
        </div>
      );
    };
  });

  afterEach(() => {
    TestEnvironment.cleanup();
  });

  it('应该检测点击手势', () => {
    const onTap = MockFactory.createMockFn();
    
    render(<TestComponent onTap={onTap} />);
    
    const gestureArea = screen.getByTestId('gesture-area');
    
    // 模拟快速点击
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchEnd(gestureArea, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    
    expect(onTap).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tap',
        center: { x: 100, y: 100 },
      })
    );
  });

  it('应该检测滑动手势', () => {
    const onSwipe = MockFactory.createMockFn();
    
    render(<TestComponent onSwipe={onSwipe} />);
    
    const gestureArea = screen.getByTestId('gesture-area');
    
    // 模拟向左滑动
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [{ clientX: 50, clientY: 100 }],
    });
    
    fireEvent.touchEnd(gestureArea, {
      changedTouches: [{ clientX: 20, clientY: 100 }],
    });
    
    expect(onSwipe).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'swipe',
        direction: 'left',
        deltaX: -80,
        deltaY: 0,
      })
    );
  });

  it('应该检测缩放手势', () => {
    const onPinch = MockFactory.createMockFn();
    
    render(<TestComponent onPinch={onPinch} />);
    
    const gestureArea = screen.getByTestId('gesture-area');
    
    // 模拟双指缩放
    fireEvent.touchStart(gestureArea, {
      touches: [
        { clientX: 50, clientY: 50 },
        { clientX: 150, clientY: 150 },
      ],
    });
    
    fireEvent.touchMove(gestureArea, {
      touches: [
        { clientX: 40, clientY: 40 },
        { clientX: 160, clientY: 160 },
      ],
    });
    
    expect(onPinch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pinch',
        scale: expect.any(Number),
        center: { x: 100, y: 100 },
      })
    );
  });

  it('应该跟踪触摸状态', () => {
    render(<TestComponent />);
    
    const gestureArea = screen.getByTestId('gesture-area');
    
    // 初始状态
    expect(screen.getByText('触摸状态: 未触摸')).toBeInTheDocument();
    expect(screen.getByText('触摸数量: 0')).toBeInTheDocument();
    
    // 开始触摸
    fireEvent.touchStart(gestureArea, {
      touches: [{ clientX: 100, clientY: 100 }],
    });
    
    expect(screen.getByText('触摸状态: 触摸中')).toBeInTheDocument();
    expect(screen.getByText('触摸数量: 1')).toBeInTheDocument();
    
    // 结束触摸
    fireEvent.touchEnd(gestureArea, {
      changedTouches: [{ clientX: 100, clientY: 100 }],
    });
    
    expect(screen.getByText('触摸状态: 未触摸')).toBeInTheDocument();
    expect(screen.getByText('触摸数量: 0')).toBeInTheDocument();
  });
});