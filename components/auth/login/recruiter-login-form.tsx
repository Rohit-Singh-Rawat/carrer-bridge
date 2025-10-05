"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight01Icon,
  LockPasswordIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import AuthContainer from "@/components/auth/auth-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const recruiterLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RecruiterLoginFormData = z.infer<typeof recruiterLoginSchema>;

export default function RecruiterLoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecruiterLoginFormData>({
    resolver: zodResolver(recruiterLoginSchema),
  });

  const onSubmit = async (data: RecruiterLoginFormData) => {
    const { loginRecruiter } = await import("@/actions/auth");
    const result = await loginRecruiter(data);

    if (!result.success) {
      toast.error(result.message);
    } else {
      toast.success("Successfully logged in! Redirecting...");
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    }
  };

  return (
    <AuthContainer imageOnLeft={true}>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-['outfit'] font-normal mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground font-['outfit'] font-light">
            Sign in to your recruiter account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-['outfit'] font-normal text-foreground/80"
            >
              Work Email
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Mail01Icon}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                size={20}
              />
              <Input
                id="email"
                type="email"
                placeholder="Enter your work email"
                className='pl-12 h-12 rounded-full bg-background border-border/50 font-["outfit"] font-light focus-visible:border-primary/50'
                {...register("email")}
                aria-invalid={!!errors.email}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive font-['outfit'] font-light mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-['outfit'] font-normal text-foreground/80"
            >
              Password
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={LockPasswordIcon}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                size={20}
              />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className='pl-12 h-12 rounded-full bg-background border-border/50 font-["outfit"] font-light focus-visible:border-primary/50'
                {...register("password")}
                aria-invalid={!!errors.password}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive font-['outfit'] font-light mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-['outfit'] font-light"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Signing in..."
            className='w-full h-12 rounded-full text-base font-["outfit"] font-normal shadow-sm hover:shadow-md transition-all'
          >
            Sign in as Recruiter
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-4 text-muted-foreground/60 font-['outfit'] font-light uppercase tracking-wider">
                Or
              </span>
            </div>
          </div>

          <div className="space-y-4 text-center pt-2">
            <p className="text-sm text-muted-foreground font-['outfit'] font-light">
              New to Career Bridge?{" "}
              <Link
                href="/register/recruiter"
                className="text-primary hover:underline font-normal"
              >
                Create recruiter account
              </Link>
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-['outfit'] font-light"
            >
              Login as User
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </div>
        </form>
      </div>
    </AuthContainer>
  );
}
