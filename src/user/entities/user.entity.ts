import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import Message from '../../chat/entities/message.entity';
import Participant from '../../chat/entities/participant.entity';
import PublicFile from '../../publicFiles/publicFile.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  public id: number;

  @Column({ unique: true })
  @ApiProperty()
  public email: string;

  @Column()
  @ApiProperty()
  public name: string;

  @Column({ select: false })
  @Exclude()
  public password: string;

  @Column({ default: false })
  @ApiProperty({ default: false })
  public is_online: boolean;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  @ApiProperty()
  public last_online_date: Date;

  @OneToMany(() => Message, (message: Message) => message.user)
  public messages: Message[];

  @OneToMany(
    () => Participant,
    (participants: Participant) => participants.user,
  )
  public participants: Participant[];

  @JoinColumn()
  @Transform(({ value }) => {
    return (
      value?.url ||
      'https://chat-bucket-project.s3.eu-central-1.amazonaws.com/default-avatar.jpg'
    );
  })
  @OneToOne(() => PublicFile, { eager: true, nullable: true })
  @ApiProperty({ type: String })
  public avatar?: PublicFile;
}

export default User;
