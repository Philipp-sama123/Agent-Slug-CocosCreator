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
  // Record the unique touch ID being used for the joystick
  private _touchId: number | null = null;
  // Keep track of the offset to avoid a sudden jump when touch starts
  private _touchOffset: Vec2 = new Vec2(0, 0);

  protected onLoad() {
    this.knob.setPosition(Vec3.ZERO);
  }

  protected start() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  private onTouchStart(event: EventTouch) {
    // Only start dragging if no other touch is already controlling the joystick
    if (this._touchId !== null) return;

    tween(this.knob).stop();
    this._dragging = true;

    // Record the unique touch ID
    this._touchId = event.getID();

    const touchLocation = event.getLocation();
    const worldPos = new Vec3(touchLocation.x, touchLocation.y, 0);
    const localPos = this.node
      .getComponent(UITransform)
      ?.convertToNodeSpaceAR(worldPos);
    if (localPos) {
      // Calculate the touch offset relative to the current knob position (initially at zero)
      this._touchOffset.set(localPos.x - this.knob.position.x, 0);
    }
    // Update the knob position with the new offset
    this.onTouchMove(event);
  }

  private onTouchMove(event: EventTouch) {
    // Ignore if not dragging or this touch is not the one registered
    if (!this._dragging || (this._touchId !== event.getID())) return;

    const touchLocation = event.getLocation();
    const worldPos = new Vec3(touchLocation.x, touchLocation.y, 0);
    const localPos = this.node
      .getComponent(UITransform)
      ?.convertToNodeSpaceAR(worldPos);
    if (!localPos) return;

    // Adjust by the initial offset for continuity
    let deltaX = localPos.x - this._touchOffset.x;

    // Clamp the horizontal movement to the radius
    if (Math.abs(deltaX) > this.radius) {
      deltaX = deltaX > 0 ? this.radius : -this.radius;
    }

    this.knob.setPosition(new Vec3(deltaX, 0, 0));
    this.input.x = deltaX / this.radius;
    this.input.y = 0;
  }

  private onTouchEnd(event: EventTouch) {
    // Only process the touch end if it is the one we are tracking
    if (this._touchId !== event.getID()) return;

    this._dragging = false;
    // Reset the touch id so a new touch can start the joystick
    this._touchId = null;

    tween(this.knob).to(0.2, { position: Vec3.ZERO }).start();
    this.input.set(0, 0);
  }

  protected onDestroy() {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }
}
