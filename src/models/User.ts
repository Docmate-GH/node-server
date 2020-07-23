import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'

@Entity()
export class User {

  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  name?: string

  @Column()
  email: string

  @Column()
  password: string

  @CreateDateColumn()
  createdDate: Date
}
