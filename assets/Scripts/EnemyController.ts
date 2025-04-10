import {
  _decorator,
  animation,
  Collider2D,
  Color,
  Component,
  Graphics,
  Node,
  PhysicsRayResult,
  PhysicsSystem2D,
  RigidBody2D,
  Vec2,
  Vec3,
} from "cc";
import { DEBUG } from "cc/env";
import { PlayerController } from "./PlayerController";

const { ccclass, property } = _decorator;

@ccclass("EnemyController")
export class EnemyController extends Component {
  @property({ tooltip: "Movement speed of the enemy" })
  moveSpeed: number = 2;

  @property({ tooltip: "Distance at which enemy stops to attack" })
  attackRange: number = 50;

  @property({ tooltip: "Hit Cooldown" })
  hitDuration: number = 1;

  @property
  private _player: Node | null = null;

  private _animationCtrl: animation.AnimationController;
  private _rigidBody: RigidBody2D;

  private _isHit: boolean = false;
  private _isAttacking: boolean = false;
  private _facingLeft: boolean = true;
  private _originalScale: Vec3 = new Vec3();

  onLoad() {
    this._animationCtrl = this.getComponent(animation.AnimationController);
    this._rigidBody = this.getComponent(RigidBody2D);
  }

  start() {
    // Find player by name or assign via property
    this._player = this.node.parent.getChildByName("Player");
    this._rigidBody.fixedRotation = true;

    Vec3.copy(this._originalScale, this.node.scale);
    this._facingLeft = this._originalScale.x > 0;
  }

  update(deltaTime: number) {
    if (!this._player || this._isHit) return;

    const playerPos = this._player.worldPosition;
    const myPos = this.node.worldPosition;
    const distance = Vec3.distance(playerPos, myPos);
    const direction = new Vec2(playerPos.x - myPos.x, 0).normalize();

    if (distance > this.attackRange) {
      this.updateMovement(direction);
    } else {
      this.updateAttack();
    }
  }

  public startAttackCollider(): void {
    if (!this._player) return;

    const playerPos = this._player.worldPosition;
    const myPos = this.node.worldPosition;
    const distance = Vec3.distance(playerPos, myPos);

    if (distance < this.attackRange) {
      this._player.getComponent(PlayerController).getHit();
    }
  }

  private updateMovement(direction: Vec2) {
    if (this._isAttacking) {
      this._isAttacking = false;
      this._animationCtrl.setValue("IsAttacking", false);
    }
    this._animationCtrl.setValue("IsMoving", true);

    this._rigidBody.linearVelocity = new Vec2(
      direction.x * this.moveSpeed,
      this._rigidBody.linearVelocity.y
    );

    if (
      (direction.x < 0 && !this._facingLeft) ||
      (direction.x > 0 && this._facingLeft)
    ) {
      this.flipDirection();
    }
  }

  private updateAttack() {
    this._rigidBody.linearVelocity = new Vec2(
      0,
      this._rigidBody.linearVelocity.y
    );

    if (!this._isAttacking) {
      this._isAttacking = true;
      this._animationCtrl.setValue("IsAttacking", true);
      this._animationCtrl.setValue("IsMoving", false);

      this.scheduleOnce(() => {
        this._isAttacking = false;
        this._animationCtrl.setValue("IsAttacking", false);
      }, 1);
    }
  }

  private flipDirection() {
    this._facingLeft = !this._facingLeft;
    const newScale = new Vec3(
      this._facingLeft
        ? Math.abs(this._originalScale.x)
        : -Math.abs(this._originalScale.x),
      this._originalScale.y,
      this._originalScale.z
    );
    this.node.setScale(newScale);
  }

  public getHit() {
    // Set hit state and play hit animation
    this._isHit = true;
    this._animationCtrl.setValue("IsHit", true);
    this._animationCtrl.setValue("IsMoving", false);
    this._animationCtrl.setValue("IsAttacking", false);

    // Immediately stop enemy movement by assigning a new zero vector
    this._rigidBody.linearVelocity = new Vec2(
      0,
      this._rigidBody.linearVelocity.y
    );

    // Stop enemy for the duration of hitDuration then resume normal behavior
    this.scheduleOnce(() => {
      this._isHit = false;
      this._animationCtrl.setValue("IsHit", false);
    }, this.hitDuration);
  }
}
