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
  BoxCollider2D,
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

  @property
  shotsBeforeReload: number = 6;

  @property
  dodgeDuration: number = 3;
  
  @property
  dodgeForce: number = 10;

  @property({ type: BoxCollider2D, tooltip: "Standard Collider" })
  standardCollider: BoxCollider2D;

  @property({ type: BoxCollider2D, tooltip: "Dodge Collider" })
  dodgeCollider: BoxCollider2D;

  @property({ type: Prefab, tooltip: "Bullet Prefab" })
  public bulletPrefab: Prefab;

  @property({ type: Vec3, tooltip: "Bullet spawn offset from player center" })
  public bulletOffset: Vec3 = new Vec3(25, 5, 0);

  @property({ type: Animation })
  public bloodImpact: Animation;

  private _horizontalInput: number = 0;
  private _isGrounded: boolean = true;
  private _canDoubleJump: boolean = true;
  private _originalScale: Vec3 = new Vec3();
  private _facingLeft: boolean = true;

  // New properties to track reload state.
  private _isReloading: boolean = false;
  private _shotsFired: number = 0;
  private _isDodging: boolean = false;
  private _isShooting: boolean = false;
  private _isHit: boolean = false;
  private _isRunning: boolean;
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
    if (this._isReloading) return;
    if (this._isDodging) return;

    const targetVelocity = new Vec2(
      this._horizontalInput * (this._isRunning ? 2 : 1) * this.moveSpeed,
      this.rigidBody.linearVelocity.y
    );
    this.rigidBody.linearVelocity = targetVelocity;

    if (this._isShooting) return;

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
        if (this._isRunning) {
          if (!this.animationComp.getState("run")?.isPlaying) {
            this.animationComp.play("run");
          }
        } else {
          if (!this.animationComp.getState("walk")?.isPlaying) {
            this.animationComp.play("walk");
          }
        }
      } else {
        if (!this.animationComp.getState("idle")?.isPlaying) {
          this.animationComp.play("idle");
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

  public jump() {
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

  public shoot() {
    if (this._isReloading) {
      // If currently reloading, skip shooting.
      console.log("Currently reloading. Cannot shoot.");
      return;
    }
    if (this._isShooting) {
      console.log("Currently shooting. Cannot shoot.");
      return;
    }
    // If the player has fired the allowed number of shots, play reload animation
    if (this._shotsFired >= this.shotsBeforeReload) {
      this._isReloading = true;
      this.rigidBody.linearVelocity = new Vec2(
        0,
        this.rigidBody.linearVelocity.y
      );

      this.animationComp.play("reload");
      console.log("Reloading...");

      // Schedule end of reload animation.
      const reloadDuration = this.animationComp.getState("reload").duration;
      this.scheduleOnce(() => {
        this._isReloading = false;
        this._shotsFired = 0;
        // Resume the previous animation based on grounded state
        if (!this._isGrounded) {
          this.animationComp.play(
            this.rigidBody.linearVelocity.y > 0 ? "jump" : "fall"
          );
        } else {
          this.animationComp.play(
            Math.abs(this._horizontalInput) > 0.1 ? "walk" : "idle"
          );
        }
        console.log("Reload complete.");
      }, reloadDuration);
      return;
    }

    // Proceed with shooting if not reloading.
    let shootAnim = "shootIdle";
    if (this._isDodging) {
      shootAnim = "slideShoot";
    } else if (!this._isGrounded) {
      shootAnim =
        this.rigidBody.linearVelocity.y > 0 ? "shootJump" : "shootFall";
    } else if (Math.abs(this._horizontalInput) > 0.1) {
      shootAnim = "shootWalk";
    }
    this._isShooting = true;

    this.animationComp.play(shootAnim);

    console.log("Playing shoot animation: " + shootAnim);

    // Instantiate bullet.
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

    // Flip the bullet if needed.
    if (direction === 1) {
      const bulletScale = bullet.scale.clone();
      bullet.setScale(
        new Vec3(-Math.abs(bulletScale.x), bulletScale.y, bulletScale.z)
      );
    }

    bulletRB.linearVelocity = new Vec2(direction * bulletScript.speed, 0);

    // Increase the shots fired count.
    this._shotsFired++;

    // Schedule to return to the default animation after shooting.
    const durationDelay = this.animationComp.getState(shootAnim).duration;
    this.scheduleOnce(() => {
      // Optional: Use a minimal delay or a manual ground check (e.g., using a downward raycast)
      if (Math.abs(this.rigidBody.linearVelocity.y) < 0.1) {
        this._isGrounded = true;
      }

      this._isShooting = false;
      if (this._isDodging) {
        this.animationComp.play("slide");
      } else if (!this._isGrounded) {
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
      console.log(
        "Resumed default animation after shooting. Grounded:",
        this._isGrounded
      );
    }, durationDelay);
  }

  public dodge() {
    const direction = this._facingLeft ? 1 : -1;

    // Apply a linear impulse in the facing direction
    this.rigidBody.applyLinearImpulseToCenter(
      new Vec2(this.dodgeForce * direction, 0),
      true
    );

    this._isDodging = true;

    this.animationComp.play("slide");

    this.standardCollider.enabled = false;
    this.dodgeCollider.enabled = true;

    this.scheduleOnce(() => {
      this._isDodging = false;
      this.standardCollider.enabled = true;
      this.dodgeCollider.enabled = false;
    }, this.dodgeDuration);

    console.log(
      "Dodging in direction: " + (this._facingLeft ? "left" : "right")
    );
  }

  public getHit() {
    if (this.bloodImpact) {
      const hitDuration = this.bloodImpact.getState("bloodImpact").duration;
      this.bloodImpact.play("bloodImpact");
      this._isHit = true;
      this.scheduleOnce(() => {
        this._isHit = false;
      }, hitDuration);
    }
    console.log("Enemy hit Player");
  }

  public setHorizontalInput(value: number) {
    // this._horizontalInput = value;
    // if (!this._facingLeft && this._horizontalInput > 0) {
    //   this.flipDirection();
    // } else if (this._facingLeft && this._horizontalInput < 0) {
    //   this.flipDirection();
    // }
  }
  move(horizontalInput: number) {
    this._horizontalInput = horizontalInput;

    if (this._horizontalInput > 0 && !this._facingLeft) this.flipDirection();
    else if (this._horizontalInput < 0 && this._facingLeft)
      this.flipDirection();
  }
  private onKeyDown(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.SPACE:
        this.jump();
        break;
      case KeyCode.KEY_D:
        this.move(0.5);
        break;
      case KeyCode.KEY_A:
        this.move(-0.5);
        break;
      case KeyCode.ENTER:
        this.shoot();
        break;
      case KeyCode.KEY_S:
        this.dodge();
        break;
      case KeyCode.SHIFT_LEFT:
        this.setIsRunning(true);
        break;
    }
  }
  setIsRunning(isRunning: boolean) {
    this._isRunning = isRunning;
  }

  private onKeyUp(event: EventKeyboard) {
    switch (event.keyCode) {
      case KeyCode.KEY_D:
      case KeyCode.KEY_A:
        this.move(0);
        break;
      case KeyCode.SHIFT_LEFT:
        this.setIsRunning(false);
        break;
    }
  }

  private onCollisionEnter(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    console.warn("onCollisionEnter otherCollider.group", otherCollider.group);
    //  if (otherCollider.node.name === "GROUND") {
    if (otherCollider.group === 1) {
      // Default Group for now
      this.enterGrounded();
    }
  }

  private onCollisionExit(
    selfCollider: Collider2D,
    otherCollider: Collider2D,
    contact: IPhysics2DContact | null
  ) {
    console.warn("onCollisionExit otherCollider.group", otherCollider.group);

    // if (otherCollider.node.name === "GROUND") {
    if (otherCollider.group === 1) {
      // Default Group for now
      this.exitGrounded();
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

  private exitGrounded() {
    this._isGrounded = false;
    console.log("Left Ground.");
  }

  private enterGrounded() {
    this._isGrounded = true;
    this._canDoubleJump = true;
    console.log("Landed on Ground. Reset jumping/falling states.");
  }
}
