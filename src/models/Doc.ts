import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Column, OneToMany } from "typeorm";
import { Page } from "./Page";

@Entity()
export class Doc {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  slug: string
  
  @Column()
  title: string

  @OneToMany(type => Page, page => page.doc)
  pages: Page[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}