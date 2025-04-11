import {
  _decorator,
  Animation,
  Collider2D,
  Component,
  Node,
  RigidBody2D,
  Vec2,
  Vec3,
} from "cc";
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

  private animationComp: Animation;
  private _rigidBody: RigidBody2D;

  private _isHit: boolean = false;
  private _isAttacking: boolean = false;
  private _facingLeft: boolean = true;
  private _originalScale: Vec3 = new Vec3();

  onLoad() {
    this.animationComp = this.node.getComponent(Animation);
    this._rigidBody = this.node.getComponent(RigidBody2D);
  }

  start() {
    if (!this._player) {
      this._player = this.node.parent.getChildByName("Player");
    }
    this._rigidBody.fixedRotation = true;

    Vec3.copy(this._originalScale, this.node.scale);
    this._facingLeft = this._originalScale.x > 0;

    this.animationComp.play("idle");
  }

  update(deltaTime: number) {
    // If hit, don't update movement/attack animation.
    if (!this._player || this._isHit) return;

    const playerPos = this._player.worldPosition;
    const myPos = this.node.worldPosition;
    const distance = Vec3.distance(playerPos, myPos);
    const direction = new Vec2(playerPos.x - myPos.x, 0).normalize();

    // If the enemy is far away from the player, play movement or idle animation.
    if (distance > this.attackRange) {
      // Determine if movement is necessary or simply idle.
      if (Math.abs(direction.x) > 0.01) {
        this.updateMovement(direction);
      } else {
        // When there's no clear movement, play idle.
        if (!this.animationComp.getState("idle")?.isPlaying) {
          this.animationComp.play("idle");
        }
        this._rigidBody.linearVelocity = new Vec2(
          0,
          this._rigidBody.linearVelocity.y
        );
      }
    } else {
      // Close enough to attack.
      this.updateAttack();
    }
  }

  public startAttackCollider(): void {
    if (!this._player) return;

    const playerPos = this._player.worldPosition;
    const myPos = this.node.worldPosition;
    const distance = Vec3.distance(playerPos, myPos);

    if (distance < this.attackRange) {
      this._player.getComponent(PlayerController)?.getHit();
    }
  }

  private updateMovement(direction: Vec2) {
    if (this._isAttacking) {
      this._isAttacking = false;
    }
    if (!this.animationComp.getState("move")?.isPlaying) {
      this.animationComp.play("move");
    }
    this._rigidBody.linearVelocity = new Vec2(
      direction.x * this.moveSpeed,
      this._rigidBody.linearVelocity.y
    );

    // Flip the enemy if needed.
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
      this.animationComp.play("attack");

      this.scheduleOnce(() => {
        this._isAttacking = false;

        if (this._player) {
          const playerPos = this._player.worldPosition;
          const myPos = this.node.worldPosition;
          const distance = Vec3.distance(playerPos, myPos);
          if (distance > this.attackRange) {
            this.animationComp.play("move");
          } else {
            this.animationComp.play("idle");
          }
        }
      }, this.animationComp.getState("attack").duration);
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
    this._isHit = true;
    this.animationComp.play("hit");

    this._rigidBody.linearVelocity = new Vec2(
      0,
      this._rigidBody.linearVelocity.y
    );

    this.scheduleOnce(() => {
      this._isHit = false;
    }, this.animationComp.getState("hit").duration);
  }
}
