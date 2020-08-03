import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Doc } from "./Doc";

@Entity()
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  index: number

  @Column()
  title: string

  @Column('text')
  content: string

  @ManyToOne(type => Doc, doc => doc.pages)
  doc: Doc

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}