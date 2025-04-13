import {
  _decorator,
  Component,
  Node,
  EventTouch,
  Vec2,
  Vec3,
  UITransform,
  tween,
} from "cc";
const { ccclass, property } = _decorator;

@ccclass("Joystick")
export class Joystick extends Component {
  @property({ type: Node })
  public knob: Node = null!;

  @property
  public radius: number = 75;

  public input: Vec2 = new Vec2(0, 0);
  private _dragging: boolean = false;

  protected onLoad() {
    this.knob.setPosition(Vec3.ZERO);
  }

  protected start() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }
  private _touchOffset: Vec2 = new Vec2(0, 0);

  private onTouchStart(event: EventTouch) {
    tween(this.knob).stop();
    this._dragging = true;

    // Calculate touch offset relative to current knob position (which is normally zero)
    const touchLocation = event.getLocation();
    const worldPos = new Vec3(touchLocation.x, touchLocation.y, 0);
    const localPos = this.node
      .getComponent(UITransform)
      ?.convertToNodeSpaceAR(worldPos);
    if (localPos) {
      // Instead of snapping directly, record the difference
      this._touchOffset.set(localPos.x - this.knob.position.x, 0);
    }
    // Call move handler to update knob position with new offset
    this.onTouchMove(event);
  }

  private onTouchMove(event: EventTouch) {
    if (!this._dragging) return;

    const touchLocation = event.getLocation();
    const worldPos = new Vec3(touchLocation.x, touchLocation.y, 0);
    const localPos = this.node
      .getComponent(UITransform)
      ?.convertToNodeSpaceAR(worldPos);
    if (!localPos) return;

    // Adjust by the initial offset so that the knob movement feels continuous
    let deltaX = localPos.x - this._touchOffset.x;

    // Clamp the horizontal movement
    if (Math.abs(deltaX) > this.radius) {
      deltaX = deltaX > 0 ? this.radius : -this.radius;
    }

    this.knob.setPosition(new Vec3(deltaX, 0, 0));
    this.input.x = deltaX / this.radius;
    this.input.y = 0;
  }

  private onTouchEnd(event: EventTouch) {
    this._dragging = false;
    tween(this.knob).to(0.2, { position: Vec3.ZERO }).start();
    this.input = new Vec2(0, 0);
  }

  protected onDestroy() {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }
}
