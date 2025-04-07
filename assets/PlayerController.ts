import {
  _decorator,
  animation,
  Component,
  EventKeyboard,
  input,
  Input,
  KeyCode,
  Vec3,
  Vec2,
  RigidBody2D,
  Collider2D,
  Contact2DType,
  IPhysics2DContact,
  UITransform,
  Prefab,
  instantiate,
} from "cc";
import { Bullet } from "./Bullet";
const { ccclass, property } = _decorator;

@ccclass("PlayerController")
export class PlayerController extends Component {
  @property({ type: animation.AnimationController })
  public animationCtrl: animation.AnimationController;

  @property({ type: RigidBody2D })
  public rigidBody: RigidBody2D;

  @property
  moveSpeed: number = 5;

  @property
  jumpForce: number = 8;

  @property
  groundCheckOffset: number = 0.2;

  @property({ type: Prefab, tooltip: "Bullet Prefab" })
  bulletPrefab: Prefab;

  @property({ type: Vec3, tooltip: "Bullet spawn offset from player center" })
  bulletOffset: Vec3 = new Vec3(25, 5, 0); // Adjust default values as needed

  private _horizontalInput: number = 0;
  private _isGrounded: boolean = true;
  private _canDoubleJump: boolean = true;
  private _originalScale: Vec3 = new Vec3();
  private _facingLeft: boolean = true;

  protected start() {
    // Store original scale for flipping
    Vec3.copy(this._originalScale, this.node.scale);
    // Set _facingLeft based on the initial scale
    this._facingLeft = this._originalScale.x < 0; // true if negative, false otherwise

    this.rigidBody.fixedRotation = true;

    // Setup collision events for ground detection
    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.on(
        Contact2DType.BEGIN_CONTACT,
        this.onGroundCollisionEnter,
        this
      );
      collider.on(Contact2DType.END_CONTACT, this.onGroundCollisionExit, this);
    }
  }

  protected onLoad(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  update(deltaTime: number) {
    // Update horizontal velocity based on input
    const targetVelocity = new Vec2(
      this._horizontalInput * this.moveSpeed,
      this.rigidBody.linearVelocity.y
    );
    this.rigidBody.linearVelocity = targetVelocity;

    // Update movement animation
    this.animationCtrl.setValue(
      "IsMoving",
      Math.abs(this._horizontalInput) > 0.1
    );

    // Update vertical velocity parameter for animation blending
    const verticalVel = this.rigidBody.linearVelocity.y;
    this.animationCtrl.setValue("VerticalVelocity", verticalVel);

    // Manage falling state: if not grounded and vertical velocity is negative, trigger falling animation.
    if (!this._isGrounded && verticalVel < 0) {
      this.animationCtrl.setValue("IsFalling", true);
      this.animationCtrl.setValue("IsJumping", false);
      console.log("State: Falling");
    } else {
      this.animationCtrl.setValue("IsFalling", false);
    }
  }
  protected onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this);

    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.off(
        Contact2DType.BEGIN_CONTACT,
        this.onGroundCollisionEnter,
        this
      );
      collider.off(Contact2DType.END_CONTACT, this.onGroundCollisionExit, this);
    }
  }

  private onKeyDown(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.SPACE:
        this.jump();
        break;
      case KeyCode.KEY_D:
        this._horizontalInput = 1;
        if (!this._facingLeft) this.flipDirection();
        break;
      case KeyCode.KEY_A:
        this._horizontalInput = -1;
        if (this._facingLeft) this.flipDirection();
        break;
      case KeyCode.ENTER:
        this.shoot();
        break;
    }
  }

  private onKeyUp(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.KEY_D:
      case KeyCode.KEY_A:
        this._horizontalInput = 0;
        break;
    }
  }

  private flipDirection() {
    this._facingLeft = !this._facingLeft;
    const newScale = new Vec3(
      this._facingLeft ? -this._originalScale.x : this._originalScale.x,
      this._originalScale.y,
      this._originalScale.z
    );
    this.node.setScale(newScale);
  }

  private jump() {
    if (this._isGrounded) {
      this.rigidBody.linearVelocity = new Vec2(
        this.rigidBody.linearVelocity.x,
        this.jumpForce
      );
      this._isGrounded = false;
      this._canDoubleJump = true;

      // Set animator parameters for jump state
      this.animationCtrl.setValue("IsJumping", true);
      this.animationCtrl.setValue("IsFalling", false);
      console.log("Primary Jump initiated.");
    } else if (this._canDoubleJump) {
      this.rigidBody.linearVelocity = new Vec2(
        this.rigidBody.linearVelocity.x,
        this.jumpForce * 0.8
      );
      this._canDoubleJump = false;
      this.animationCtrl.setValue("IsJumping", true);
      this.animationCtrl.setValue("IsFalling", false);
      console.log("Double Jump initiated.");
    }
  }

  private shoot() {
    let shootAnimVal = 0; // default: no shooting

    if (this.animationCtrl.getValue("IsJumping")) {
      shootAnimVal = 3; // jumping shoot
    } else if (this.animationCtrl.getValue("IsFalling")) {
      shootAnimVal = 4; // falling shoot
    } else if (this.animationCtrl.getValue("IsMoving")) {
      shootAnimVal = 2; // walk shoot
    } else {
      shootAnimVal = 1; // idle shoot
    }

    // Set the numeric shootState parameter
    this.animationCtrl.setValue("ShootState", shootAnimVal);
    console.log("Shooting state set to: " + shootAnimVal);

    this.scheduleOnce(() => {
      this.animationCtrl.setValue("ShootState", 0);
      console.log("Shooting state reset to 0.");
    }, 0.1);

    const direction = this._facingLeft ? 1 : -1;
    const offset = new Vec3(this.bulletOffset.x * direction, this.bulletOffset.y, 0);
    const spawnPos = this.node.position.clone().add(offset);
  
    const bullet = instantiate(this.bulletPrefab);
    bullet.setPosition(spawnPos);
    this.node.parent.addChild(bullet);
  
    const bulletRB = bullet.getComponent(RigidBody2D);
    const bulletScript = bullet.getComponent(Bullet);
    if (direction === 1) {
        const bulletScale = bullet.scale.clone();
        bullet.setScale(new Vec3(-Math.abs(bulletScale.x), bulletScale.y, bulletScale.z));
      }
    bulletRB.linearVelocity = new Vec2(direction * bulletScript.speed, 0);
  }

  private onGroundCollisionEnter(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    if (otherCollider.node.name === "GROUND") {
      // When the player lands, update state and reset animation parameters
      this._isGrounded = true;
      this._canDoubleJump = true;
      this.animationCtrl.setValue("IsJumping", false);
      this.animationCtrl.setValue("IsFalling", false);
      this.animationCtrl.setValue("VerticalVelocity", 0);
      console.log("Landed on Ground. Reset jumping/falling states.");
    }
  }

  private onGroundCollisionExit(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    if (otherCollider.node.name === "GROUND") {
      this._isGrounded = false;
      console.log("Left Ground.");
    }
  }
}
