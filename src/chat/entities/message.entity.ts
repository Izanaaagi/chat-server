import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import User from '../../user/entities/user.entity';
import Room from './room.entity';
import PrivateFile from '../../privateFiles/privateFile.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
class Message {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @Column()
  @ApiProperty()
  public message: string;

  @ManyToOne(() => User, (user: User) => user.messages)
  @ApiProperty({ type: () => User })
  public user: User;
  @ManyToOne(() => Room, (room: Room) => room.messages)
  @ApiProperty({ type: Room })
  public room: Room;

  @JoinColumn()
  @OneToOne(() => PrivateFile, { nullable: true })
  @ApiProperty({ nullable: true, type: PrivateFile })
  public privateFile?: PrivateFile;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  @ApiProperty({ type: Date })
  public created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  @ApiProperty({ type: Date })
  public updated_at: Date;

  @Column({ default: false })
  @ApiProperty({ default: false })
  public is_read: boolean;
}

export default Message;
