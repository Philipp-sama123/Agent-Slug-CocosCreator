import {
  _decorator,
  Animation,
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
  Prefab,
  instantiate,
} from "cc";
import { Bullet } from "./Bullet";
const { ccclass, property } = _decorator;

@ccclass("PlayerController")
export class PlayerController extends Component {
  private animationComp: Animation;
  private rigidBody: RigidBody2D;

  @property
  public moveSpeed: number = 5;

  @property
  public jumpForce: number = 8;

  @property
  public groundCheckOffset: number = 0.2;

  @property({ type: Prefab, tooltip: "Bullet Prefab" })
  public bulletPrefab: Prefab;

  @property({ type: Vec3, tooltip: "Bullet spawn offset from player center" })
  public bulletOffset: Vec3 = new Vec3(25, 5, 0);

  private _horizontalInput: number = 0;
  private _isGrounded: boolean = true;
  private _canDoubleJump: boolean = true;
  private _originalScale: Vec3 = new Vec3();
  private _facingLeft: boolean = true;
  private _isShooting: boolean = false;

  protected onLoad(): void {
    this.animationComp = this.node.getComponent(Animation);
    this.rigidBody = this.node.getComponent(RigidBody2D);
  }

  protected start() {
    Vec3.copy(this._originalScale, this.node.scale);
    this._facingLeft = this._originalScale.x < 0;
    this.rigidBody.fixedRotation = true;

    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
      collider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
    }
  }

  protected onEnable(): void {
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
  }

  protected update(dt: number) {
    const targetVelocity = new Vec2(
      this._horizontalInput * this.moveSpeed,
      this.rigidBody.linearVelocity.y
    );
    this.rigidBody.linearVelocity = targetVelocity;

    if (!this._isShooting) {
      if (!this._isGrounded) {
        if (this.rigidBody.linearVelocity.y > 0) {
          if (!this.animationComp.getState("jump")?.isPlaying) {
            this.animationComp.play("jump");
          }
        } else {
          if (!this.animationComp.getState("fall")?.isPlaying) {
            this.animationComp.play("fall");
          }
        }
      } else {
        if (Math.abs(this._horizontalInput) > 0.1) {
          if (!this.animationComp.getState("walk")?.isPlaying) {
            this.animationComp.play("walk");
          }
        } else {
          if (!this.animationComp.getState("idle")?.isPlaying) {
            this.animationComp.play("idle");
          }
        }
      }
    }
  }

  protected onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.onKeyUp, this);

    const collider = this.getComponent(Collider2D);
    if (collider) {
      collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
      collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
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

      this.animationComp.play("jump");
      console.log("Primary Jump initiated.");
    } else if (this._canDoubleJump) {
      this.rigidBody.linearVelocity = new Vec2(
        this.rigidBody.linearVelocity.x,
        this.jumpForce * 0.8
      );
      this._canDoubleJump = false;

      this.animationComp.play("jump");
      console.log("Double Jump initiated.");
    }
  }

  private shoot() {
    let shootAnim = "shootIdle";

    if (!this._isGrounded) {
      shootAnim =
        this.rigidBody.linearVelocity.y > 0 ? "shootJump" : "shootFall";
    } else if (Math.abs(this._horizontalInput) > 0.1) {
      shootAnim = "shootWalk";
    }
    this._isShooting = true;

    this.animationComp.play(shootAnim);
    console.log("Playing shoot animation: " + shootAnim);

    const direction = this._facingLeft ? 1 : -1;
    const offset = new Vec3(
      this.bulletOffset.x * direction,
      this.bulletOffset.y,
      0
    );
    const spawnPos = this.node.position.clone().add(offset);

    const bullet = instantiate(this.bulletPrefab);
    bullet.setPosition(spawnPos);
    this.node.parent.addChild(bullet);

    const bulletRB = bullet.getComponent(RigidBody2D);
    const bulletScript = bullet.getComponent(Bullet);

    // flip the bullet if needed.
    if (direction === 1) {
      const bulletScale = bullet.scale.clone();
      bullet.setScale(
        new Vec3(-Math.abs(bulletScale.x), bulletScale.y, bulletScale.z)
      );
    }

    bulletRB.linearVelocity = new Vec2(direction * bulletScript.speed, 0);
    let durationDelay = this.animationComp.getState(shootAnim).duration;

    this.scheduleOnce(() => {
      this._isShooting = false;
      if (!this._isGrounded) {
        if (this.rigidBody.linearVelocity.y > 0) {
          this.animationComp.play("jump");
        } else {
          this.animationComp.play("fall");
        }
      } else {
        if (Math.abs(this._horizontalInput) > 0.1) {
          this.animationComp.play("walk");
        } else {
          this.animationComp.play("idle");
        }
      }
      console.log("Resumed default animation after shooting.");
    }, durationDelay);
  }

  public getHit() {
    console.log("Enemy hit Player");
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

  private onCollisionEnter(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    if (otherCollider.node.name === "GROUND") {
      this._isGrounded = true;
      this._canDoubleJump = true;
      if (Math.abs(this._horizontalInput) > 0.1) {
        this.animationComp.play("walk");
      } else {
        this.animationComp.play("idle");
      }
      console.log("Landed on Ground. Reset jumping/falling states.");
    }
  }

  private onCollisionExit(
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
